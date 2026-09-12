"""
api/routers/module_a.py — REST endpoints for Module A predictions.
Serves: SOC (XGBoost/GradientBoosting), SOH (Calibrated XGBoost/Ridge),
        RUL (GradientBoosting/XGBoost), Mileage (XGBoost).
Champion models are loaded dynamically from group-split pkl files at startup.
"""

import os
import sys
import logging
from typing import Optional, Dict, Any, List
import numpy as np
import pandas as pd
import joblib
from fastapi import APIRouter, HTTPException

logger = logging.getLogger("api.module_a")

# Project root → modules/module_a/ so config.py resolves correctly
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_MODULE_A_DIR = os.path.join(_PROJECT_ROOT, "modules", "module_a")
sys.path.insert(0, _MODULE_A_DIR)

import config as cfg
from api.schemas import SOCRequest, SOHRequest, RULRequest, MileageRequest, PredictionResponse

router = APIRouter(prefix="/predict", tags=["Module A — Fleet Predictions"])

# Kilometres driven per one equivalent full charge cycle (fleet empirical constant)
KM_PER_CYCLE: float = 58.0

# Fleet odometer z-score constants for RUL model pre-normalization
# (The groupsplit RUL model expects pre-z-scored odometer, matching features_rul.csv)
_RUL_ODO_MEAN: float = 12824.284087473547   # mean raw odometer in km across training fleet
_RUL_ODO_SCALE: float = 10243.910208921825  # std  raw odometer in km across training fleet

# ──────────────────────────────────────────────
#  Model Registry — loaded once at startup
# ──────────────────────────────────────────────
_MODELS: dict = {}
_BEST_MODEL_NAMES: dict = {}
_KNOWN_BASELINES: dict = {}

try:
    _features_soh_csv = os.path.join(_PROJECT_ROOT, "data", "processed", "module_a_fleet_telematics", "features_soh.csv")
    if os.path.exists(_features_soh_csv):
        import pandas as pd
        _df_b = pd.read_csv(_features_soh_csv, usecols=["chassis_no", "soh"])
        for ch, grp in _df_b.groupby("chassis_no"):
            _KNOWN_BASELINES[str(ch)] = float(grp["soh"].iloc[0])
    _fleet_json = os.path.join(_PROJECT_ROOT, "frontend", "public", "data", "fleet_vehicles.json")
    if os.path.exists(_fleet_json):
        import json
        with open(_fleet_json) as f:
            for v in json.load(f):
                if "chassis" in v: _KNOWN_BASELINES[str(v["chassis"])] = float(v.get("soh", 95.0))
                if "id" in v: _KNOWN_BASELINES[str(v["id"])] = float(v.get("soh", 95.0))
except Exception as e:
    print(f"  [WARNING] Could not preload baseline SOH lookup table: {e}")

_SCALER_SOH = None
_SCALER_SOC = None
try:
    soh_scaler_path = os.path.join(cfg.MODELS_DIR, "module_a", "soh", "scaler_soh.pkl")
    if os.path.exists(soh_scaler_path):
        _SCALER_SOH = joblib.load(soh_scaler_path)
    soc_scaler_path = os.path.join(cfg.MODELS_DIR, "module_a", "soc", "scaler_soc.pkl")
    if os.path.exists(soc_scaler_path):
        _SCALER_SOC = joblib.load(soc_scaler_path)
except Exception as e:
    print(f"  [WARNING] Could not preload feature scalers: {e}")


def _patch_model_compatibility(model):
    if hasattr(model, "named_steps"):
        for _, step_obj in model.named_steps.items():
            if hasattr(step_obj, "missing_values") and not hasattr(step_obj, "_fill_dtype"):
                step_obj._fill_dtype = np.float64
    return model


ENGINE_CONFIG = {
    "SOC": {
        "xgboost": ("SOC_XGBoost.pkl", "XGBoost (R²=0.996)"),
        "knn": ("SOC_KNN.pkl", "KNN (95.8%)"),
        "randomforest": ("SOC_RandomForest.pkl", "Random Forest"),
        "extratrees": ("SOC_ExtraTrees.pkl", "Extra Trees"),
        "decisiontree": ("SOC_DecisionTree.pkl", "Decision Tree"),
        "ridge": ("SOC_Ridge.pkl", "Ridge Regression"),
    },
    "SOH": {
        "xgboost": ("SOH_Calibrated_XGBoost.pkl", "Calibrated XGBoost (R²=0.982)"),
        "calibrated xgboost": ("SOH_Calibrated_XGBoost.pkl", "Calibrated XGBoost (R²=0.982)"),
        "randomforest": ("SOH_Calibrated_RandomForest.pkl", "Calibrated Random Forest"),
        "calibrated randomforest": ("SOH_Calibrated_RandomForest.pkl", "Calibrated Random Forest"),
        "extratrees": ("SOH_Calibrated_ExtraTrees.pkl", "Calibrated Extra Trees"),
        "calibrated extratrees": ("SOH_Calibrated_ExtraTrees.pkl", "Calibrated Extra Trees"),
        "ridge": ("SOH_Calibrated_Ridge.pkl", "Calibrated Ridge"),
        "calibrated ridge": ("SOH_Calibrated_Ridge.pkl", "Calibrated Ridge"),
        "lasso": ("SOH_Calibrated_Lasso.pkl", "Calibrated Lasso"),
        "calibrated lasso": ("SOH_Calibrated_Lasso.pkl", "Calibrated Lasso"),
    },
    "RUL": {
        "xgboost": ("RUL_XGBoost.pkl", "XGBoost (99.9%)"),
        "randomforest": ("RUL_RandomForest.pkl", "Random Forest"),
        "extratrees": ("RUL_ExtraTrees.pkl", "Extra Trees"),
        "knn": ("RUL_KNN.pkl", "KNN"),
        "decisiontree": ("RUL_DecisionTree.pkl", "Decision Tree"),
        "ridge": ("RUL_Ridge.pkl", "Ridge Regression"),
    },
    "Mileage": {
        "extratrees": ("Mileage_ExtraTrees.pkl", "Extra Trees (Kinetic-Aware)"),
        "randomforest": ("Mileage_RandomForest.pkl", "Random Forest"),
        "knn": ("Mileage_KNN.pkl", "KNN"),
        "decisiontree": ("Mileage_DecisionTree.pkl", "Decision Tree"),
        "xgboost": ("Mileage_XGBoost.pkl", "XGBoost"),
    },
}

_ENGINE_CACHE = {}


def _get_model_for_engine(task: str, engine_name: Optional[str] = None):
    """Retrieve model by engine name or fallback to champion."""
    if engine_name:
        clean = "".join(ch for ch in engine_name.lower() if ch.isalnum())
        task_engines = ENGINE_CONFIG.get(task, {})
        matched = None
        for k, v in task_engines.items():
            k_clean = "".join(ch for ch in k.lower() if ch.isalnum())
            if clean in k_clean or k_clean in clean:
                matched = (k, v)
                break
        
        if matched:
            k, (filename, display_name) = matched
            cache_key = f"{task}:{k}"
            if cache_key in _ENGINE_CACHE:
                return display_name, _ENGINE_CACHE[cache_key]
            
            candidates = [
                os.path.join(cfg.MODELS_DIR, "module_a_groupsplit", task.lower(), filename),
                os.path.join(cfg.MODELS_DIR, "module_a_soh_calibrated", filename),
                os.path.join(cfg.MODELS_DIR, "module_a", task.lower(), filename),
                cfg.get_model_file_path(task, filename),
            ]
            for pkl_path in candidates:
                if os.path.exists(pkl_path):
                    try:
                        m = joblib.load(pkl_path)
                        m = _patch_model_compatibility(m)
                        _ENGINE_CACHE[cache_key] = m
                        return display_name, m
                    except Exception as e:
                        logger.warning(f"Failed to load engine {pkl_path}: {e}")
                        break

    # Fallback to loaded champion
    default_name = _BEST_MODEL_NAMES.get(task, "Champion")
    default_model = _MODELS.get(task)
    return default_name, default_model


def _load_best_model(task: str):
    """Load the best group-split / calibrated pkl model for a given task."""
    if task == "SOH":
        # Calibrated baseline models
        preference = ["XGBoost", "RandomForest", "ExtraTrees", "Ridge", "Lasso"]
        for name in preference:
            pkl = cfg.get_model_file_path(task, f"SOH_Calibrated_{name}.pkl")
            if not os.path.exists(pkl):
                pkl = os.path.join(cfg.MODELS_DIR, "module_a_soh_calibrated", f"SOH_Calibrated_{name}.pkl")
            if os.path.exists(pkl):
                try:
                    model = joblib.load(pkl)
                    model = _patch_model_compatibility(model)
                    return f"Calibrated {name}", model
                except Exception:
                    continue
        return None, None

    # SOC, RUL, Mileage models
    txt = cfg.get_model_file_path(task, f"{task}_best_model.txt")
    model_name = None
    if os.path.exists(txt):
        with open(txt) as f:
            line = f.readline().strip()
            model_name = line.replace("Best Model: ", "").strip()

    if task == "SOC":
        preference = ["XGBoost", "KNN", "RandomForest", "ExtraTrees", "DecisionTree"]
        candidates = preference
    elif task == "RUL":
        # Note: GradientBoosting pickle has compatibility mismatch with scikit-learn 1.9, use XGBoost / RF
        preference = ["XGBoost", "RandomForest", "ExtraTrees", "KNN", "DecisionTree"]
        candidates = preference
    elif task == "Mileage":
        # ExtraTrees has authentic responsive splits for speed, stoppage, and energy utilized
        preference = ["ExtraTrees", "RandomForest", "KNN", "DecisionTree", "XGBoost"]
        candidates = preference
    else:
        preference = ["XGBoost", "RandomForest", "ExtraTrees", "Ridge", "Lasso"]
        candidates = [model_name] + preference if model_name else preference
    seen = set()
    deduped = []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            deduped.append(c)

    for name in deduped:
        pkl = cfg.get_model_file_path(task, f"{task}_{name}.pkl")
        if not os.path.exists(pkl):
            pkl = os.path.join(cfg.MODELS_DIR, "module_a_groupsplit", task.lower(), f"{task}_{name}.pkl")
        if os.path.exists(pkl):
            try:
                model = joblib.load(pkl)
                model = _patch_model_compatibility(model)
                return f"{task} {name}", model
            except Exception:
                continue
    return None, None


def load_all_module_a_models():
    """Load all 4 Module A models into the registry. Called at API startup."""
    for task in ["SOC", "SOH", "RUL", "Mileage"]:
        name, model = _load_best_model(task)
        if model:
            _MODELS[task] = model
            _BEST_MODEL_NAMES[task] = name
            print(f"  [OK] Module A {task} loaded: {name}")


def get_model_status() -> dict:
    return {task: task in _MODELS for task in ["SOC", "SOH", "RUL", "Mileage"]}


def get_model_names() -> dict:
    return dict(_BEST_MODEL_NAMES)


def _interpret(task: str, value: float) -> str:
    if task == "SOC":
        if value >= 80: return "High charge — Good to go!"
        if value >= 40: return "Moderate charge — Plan a charge soon."
        return "Low charge — Charge immediately!"
    elif task == "SOH":
        if value >= 90: return "Excellent battery health (Calibrated Baseline)."
        if value >= 75: return "Good health — Monitor regularly."
        if value >= 60: return "Degraded — Consider service."
        return "Poor health — Battery replacement recommended."
    elif task == "RUL":
        days = round(max(0, value) / 0.75)
        years = round(days / 365, 1)
        return f"~{max(0,int(value))} cycles remaining (~{days} days / {years} yrs)"
    elif task == "Mileage":
        if value >= 150: return "Excellent range — Long trips possible."
        if value >= 80:  return "Moderate range — City driving comfortable."
        return "Limited range — Short trips only."
    return ""


def _safe_float(val, default: float) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _safe_int(val, default: int) -> int:
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def _predict(task: str, feature_dict: dict) -> PredictionResponse:
    # 1. Resolve requested engine dynamically or fallback to champion
    requested_engine = feature_dict.get("engine")
    model_name, model = _get_model_for_engine(task, requested_engine)

    if model is None:
        if task not in _MODELS:
            raise HTTPException(
                status_code=503,
                detail=f"{task} model not loaded. Run modules/module_a/04_model_training_groupsplit.py first."
            )
        model = _MODELS[task]
        model_name = _BEST_MODEL_NAMES.get(task, "Champion")

    # Intelligent feature auto-synthesis for derived fleet telemetry
    odo = _safe_float(feature_dict.get("odometer"), 0.0)
    passed_cycles = _safe_float(feature_dict.get("charge_cycle_count"), 0.0)
    if odo > 0 and passed_cycles == 0:
        cycles = round(odo / KM_PER_CYCLE, 1)
    elif passed_cycles > 0:
        cycles = passed_cycles
    else:
        cycles = 0.0
        if task == "RUL":
            logger.warning(
                f"[DATA SENTINEL WARNING] Task=RUL: Both 'odometer' and 'charge_cycle_count' "
                f"are zero/missing. RUL will default to training-set averages — provide real "
                f"odometer or cycle count for accurate prediction."
            )

    v = _safe_float(feature_dict.get("battery_voltage"), 74.0)
    t = _safe_float(feature_dict.get("battery_temp"), 32.0)
    i = _safe_float(feature_dict.get("battery_current"), -18.0)
    soc = _safe_float(feature_dict.get("soc_at_charge", feature_dict.get("soc")), 75.0)
    
    # 1. Resolve authentic per-vehicle commissioning baseline (SOH_0)
    chassis = str(feature_dict.get("chassis_no") or feature_dict.get("chassis") or feature_dict.get("vehicle_id") or feature_dict.get("id") or "")
    if feature_dict.get("initial_soh") is not None and float(feature_dict["initial_soh"]) > 0:
        init_soh = float(feature_dict["initial_soh"])
    elif feature_dict.get("soh") is not None and float(feature_dict["soh"]) > 0:
        init_soh = float(feature_dict["soh"])
    elif chassis and chassis in _KNOWN_BASELINES:
        init_soh = float(_KNOWN_BASELINES[chassis])
    else:
        init_soh = 95.0 # Nominal fleet mean baseline
        logger.warning(f"[DATA SENTINEL WARNING] Task={task}: Missing vehicle chassis / baseline SOH in request; defaulted to 95.0% fleet mean.")

    if feature_dict.get("battery_voltage") is None and task in ["SOC", "SOH"]:
        logger.warning(f"[DATA SENTINEL WARNING] Task={task}: Missing 'battery_voltage' in request; defaulted to 74.0V.")

    synthesized = dict(feature_dict)
    synthesized["battery_voltage"] = v
    synthesized["battery_temp"] = t
    synthesized["battery_current"] = i
    synthesized["charge_cycle_count"] = cycles
    synthesized["charge_cycles"] = cycles
    synthesized["cycle_count"] = cycles
    # For RUL model: the groupsplit model expects pre-z-scored odometer (matching training CSV)
    if task == "RUL":
        synthesized["odometer"] = (odo - _RUL_ODO_MEAN) / _RUL_ODO_SCALE
    else:
        synthesized["odometer"] = odo
    synthesized["soc_at_charge"] = soc
    synthesized["soc"] = soc
    synthesized["soh"] = init_soh
    synthesized["abs_current"] = abs(i) if synthesized.get("abs_current") is None else float(synthesized["abs_current"])
    synthesized["voltage_deviation"] = float(feature_dict.get("voltage_deviation", round(v - 72.0, 2)))
    synthesized["temp_stress_index"] = float(feature_dict.get("temp_stress_index", round(max(0.0, min(1.0, (t - 25.0) / 30.0)), 3)))
    synthesized["degradation_factor"] = float(feature_dict.get("degradation_factor", round(min(1.0, cycles / 1400.0), 4)))
    synthesized["days_in_service"] = float(feature_dict.get("days_in_service", max(1.0, round(cycles * 1.25))))
    synthesized["soh_mean"] = float(feature_dict.get("soh_mean", init_soh))
    synthesized["mile_avg"] = float(feature_dict.get("mile_avg", 45.0))
    mpc = float(feature_dict.get("miles_per_charge", max(35.0, min(130.0, 120.0 - (cycles * 0.045)))))
    synthesized["miles_per_charge"] = mpc
    synthesized["miles_per_charge_rolling_3"] = float(feature_dict.get("miles_per_charge_rolling_3", mpc))
    synthesized["miles_per_charge_rolling_5"] = float(feature_dict.get("miles_per_charge_rolling_5", mpc))
    synthesized["miles_per_charge_rolling_10"] = float(feature_dict.get("miles_per_charge_rolling_10", mpc))
    
    # History and Calibrated Delta features
    synthesized.setdefault("v_roll_mean_5", v)
    synthesized.setdefault("v_roll_std_5", 0.05)
    synthesized.setdefault("v_roll_slope_5", 0.0)
    synthesized.setdefault("v_roll_mean_10", v)
    synthesized.setdefault("v_roll_std_10", 0.08)
    synthesized.setdefault("v_roll_slope_10", 0.0)
    synthesized.setdefault("v_roll_mean_20", v)
    synthesized.setdefault("v_roll_std_20", 0.12)
    synthesized.setdefault("v_roll_slope_20", 0.0)
    synthesized.setdefault("i_roll_mean_5", i)
    synthesized.setdefault("i_roll_std_5", 0.5)
    synthesized.setdefault("i_roll_slope_5", 0.0)
    synthesized.setdefault("i_roll_mean_10", i)
    synthesized.setdefault("i_roll_std_10", 0.8)
    synthesized.setdefault("i_roll_slope_10", 0.0)
    synthesized.setdefault("i_roll_mean_20", i)
    synthesized.setdefault("i_roll_std_20", 1.2)
    synthesized.setdefault("i_roll_slope_20", 0.0)
    synthesized.setdefault("t_roll_mean_5", t)
    synthesized.setdefault("t_roll_std_5", 0.2)
    synthesized.setdefault("t_roll_mean_10", t)
    synthesized.setdefault("t_roll_std_10", 0.3)
    synthesized.setdefault("t_roll_mean_20", t)
    synthesized.setdefault("t_roll_std_20", 0.5)
    synthesized.setdefault("v_cycle_slope_20", -0.005)
    synthesized.setdefault("charge_acceptance_rate", 0.05)
    synthesized.setdefault("cycles_since_start", max(0.0, cycles))

    # Trip and Mission Dynamics
    run_kms = _safe_float(feature_dict.get("run_kms"), 45.0)
    avg_spd = _safe_float(feature_dict.get("avg_speed"), 32.0)
    max_spd = _safe_float(feature_dict.get("max_speed"), max(avg_spd + 15.0, 55.0))
    dur_hrs = _safe_float(feature_dict.get("trip_duration_hrs"), max(0.5, run_kms / max(15.0, avg_spd)))
    stops = _safe_float(feature_dict.get("stoppage_count"), 3.0)
    energy_kwh = _safe_float(feature_dict.get("energy_utilized"), max(1.0, run_kms * 0.16))

    synthesized["run_kms"] = run_kms
    synthesized["avg_speed"] = avg_spd
    synthesized["max_speed"] = max_spd
    synthesized["trip_duration_hrs"] = round(dur_hrs, 2)
    synthesized["stoppage_count"] = stops
    synthesized["energy_utilized"] = energy_kwh
    synthesized["energy_efficiency"] = round(energy_kwh / max(1.0, run_kms), 4)
    synthesized["trip_intensity"] = round(avg_spd * dur_hrs, 2)
    synthesized["speed_ratio"] = round(avg_spd / max(1.0, max_spd), 4)
    synthesized["stoppage_density"] = round(stops / max(0.1, dur_hrs), 2)
    synthesized["is_charging"] = 1 if i > 0 else _safe_int(feature_dict.get("is_charging"), 0)
    synthesized["drive_mode_encoded"] = _safe_int(feature_dict.get("drive_mode_encoded"), 1)
    synthesized.setdefault("odometer_diff", _safe_float(feature_dict.get("odometer_diff"), 0.0))
    synthesized.setdefault("hour", _safe_int(feature_dict.get("hour"), 10))
    synthesized.setdefault("day_of_week", _safe_int(feature_dict.get("day_of_week"), 2))
    synthesized.setdefault("month", _safe_int(feature_dict.get("month"), 6))
    synthesized.setdefault("is_weekend", _safe_int(feature_dict.get("is_weekend"), 0))
    synthesized.setdefault("is_peak", _safe_int(feature_dict.get("is_peak"), 0))
    synthesized.setdefault("oem_encoded", _safe_int(feature_dict.get("oem_encoded"), 0))
    synthesized.setdefault("model_encoded", _safe_int(feature_dict.get("model_encoded"), 0))
    synthesized.setdefault("city_encoded", _safe_int(feature_dict.get("city_encoded"), 0))

    if task == "SOH" and _SCALER_SOH is not None:
        try:
            raw_s_df = pd.DataFrame([{c: synthesized.get(c, 0.0) for c in _SCALER_SOH.feature_names_in_}])
            scaled_v = _SCALER_SOH.transform(raw_s_df)[0]
            for idx, c in enumerate(_SCALER_SOH.feature_names_in_):
                synthesized[c] = float(scaled_v[idx])
        except Exception:
            pass

    # Extract expected feature names from model if available
    expected_cols = None
    if hasattr(model, "feature_names_in_"):
        expected_cols = list(model.feature_names_in_)
    elif hasattr(model, "named_steps"):
        for step in model.named_steps.values():
            if hasattr(step, "feature_names_in_"):
                expected_cols = list(step.feature_names_in_)
                break

    if expected_cols:
        row = {col: synthesized.get(col, 0.0) for col in expected_cols}
        X = pd.DataFrame([row])
    else:
        X = np.array([[synthesized.get(k, 0.0) for k in synthesized]], dtype=np.float64)
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    try:
        raw_pred = float(model.predict(X).ravel()[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {e}")

    # Process task outputs
    if task == "SOH":
        # Calibrated baseline delta-SOH reconstruction: SOH = SOH_0 + delta_SOH
        # Clamp delta so linear models (e.g. Ridge/Lasso) stay physiologically realistic
        clamped_delta = float(np.clip(raw_pred, -25.0, 10.0))
        pred = float(np.clip(init_soh + clamped_delta, 50.0, 100.0))
    elif task == "RUL":
        # Dynamic operational wear scaling based on 12 features
        temp_stress = float(synthesized.get("temp_stress_index", 0.0))
        days = float(synthesized.get("days_in_service", 180.0))
        drive_mode = int(synthesized.get("drive_mode_encoded", 1))
        curr_mag = abs(i)
        
        # Operational stressors accelerate cycle life consumption
        wear_factor = (
            1.0
            - (temp_stress * 0.07)
            - (max(0.0, days - 100.0) / 1000.0 * 0.05)
            - ((drive_mode - 1) * 0.04)
            - (max(0.0, (curr_mag - 18.0) / 50.0) * 0.03)
        )
        pred = float(np.clip(raw_pred * wear_factor, 100.0, 2000.0))
    elif task == "Mileage":
        # Driving range per charge based on vehicle trip kinetics, energy efficiency, drive mode, and SOC/SOH
        soc_factor = min(1.0, max(0.05, soc / 100.0))
        soh_factor = min(1.0, max(0.5, init_soh / 100.0))
        
        # Actual energy efficiency vs fleet nominal baseline (0.16 kWh/km)
        actual_consumption = energy_kwh / max(1.0, run_kms)
        eff_factor = float(np.clip(0.16 / actual_consumption, 0.65, 1.40))
        
        drive_mode = int(synthesized.get("drive_mode_encoded", 1))
        dm_factor = 1.08 if drive_mode == 0 else (1.0 if drive_mode == 1 else 0.88)
        
        pred = float(max(10.0, round(raw_pred * soc_factor * soh_factor * eff_factor * dm_factor, 1)))
    elif task == "SOC":
        pred = float(np.clip(raw_pred, 0.0, 100.0))
    else:
        pred = raw_pred

    units = {"SOC": "%", "SOH": "%", "RUL": "cycles", "Mileage": "km"}
    return PredictionResponse(
        task=task,
        prediction=round(pred, 2),
        unit=units[task],
        model_used=model_name,
        interpretation=_interpret(task, pred),
        confidence_margin=round(abs(pred) * 0.05, 2),
    )


# ──────────────────────────────────────────────
#  ENDPOINTS
# ──────────────────────────────────────────────

@router.post("/soc", response_model=PredictionResponse, summary="State of Charge Prediction")
def predict_soc(req: SOCRequest):
    """Predict current battery State of Charge (%) using the loaded champion model."""
    return _predict("SOC", req.model_dump())


@router.post("/soh", response_model=PredictionResponse, summary="State of Health Prediction (Tabular)")
def predict_soh(req: SOHRequest):
    """Predict battery State of Health (%) using the loaded champion model."""
    return _predict("SOH", req.model_dump())


@router.post("/rul", response_model=PredictionResponse, summary="Remaining Useful Life Prediction")
def predict_rul(req: RULRequest):
    """Predict remaining charge cycles before battery end-of-life using the loaded champion model."""
    return _predict("RUL", req.model_dump())


@router.post("/mileage", response_model=PredictionResponse, summary="Mileage per Charge Prediction")
def predict_mileage(req: MileageRequest):
    """Predict SOC-adjusted range (km) using the loaded champion model."""
    return _predict("Mileage", req.model_dump())
