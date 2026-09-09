# -*- coding: utf-8 -*-
"""
Master Handbook Generator for Multi-Zone Cyber-Physical EV Battery Intelligence Platform.
Compiles a publication-grade, self-contained HTML and PDF document (40+ pages).
Embeds 25 high-resolution screenshot assets as Base64 data URIs.
Zero broken LaTeX syntax; uses clean Unicode math and formatted monospace cards.
"""

import os
import re
import sys
import base64
import subprocess
import shutil

docs_dir = r"c:\Final_Year_Project_1\docs"
img_dir = os.path.join(docs_dir, "images")
html_path = os.path.join(docs_dir, "EV_Battery_Intelligence_Master_Handbook.html")
pdf_path = os.path.join(docs_dir, "EV_Battery_Intelligence_Master_Handbook.pdf")
md_path = os.path.join(docs_dir, "EV_Battery_Intelligence_Master_Handbook.md")
artifact_dir = r"C:\Users\Admin\.gemini\antigravity-ide\brain\d91338ad-71c1-4c40-b4d1-a3d9876fbe72"

def get_b64(filename):
    p = os.path.join(img_dir, filename)
    if os.path.exists(p):
        with open(p, "rb") as f:
            b = base64.b64encode(f.read()).decode("utf-8")
            ext = os.path.splitext(filename)[1].lower().replace(".", "")
            if ext == "jpg": ext = "jpeg"
            return f"data:image/{ext};base64,{b}"
    print(f"Warning: Image file missing: {filename}")
    return ""

print("Loading all 25 high-resolution screenshot assets into Base64 cache...")
I = {
    "hero": get_b64("01_hero_story.png"),
    "sandbox": get_b64("02_live_model_sandbox.png"),
    "roi": get_b64("03_roi_calculator.png"),
    "dash_op": get_b64("04_dashboard_operations.png"),
    "dash_dt": get_b64("05_fleet_digital_twin.png"),
    "dash_se": get_b64("06_state_estimation.png"),
    "dash_th": get_b64("07_thermal_safety.png"),
    "dash_kn": get_b64("08_knee_prognostics.png"),
    "dash_dp": get_b64("09_driver_profiling.png"),
    "dash_me": get_b64("10_meta_ensemble_report.png"),
    "copilot": get_b64("11_ai_copilot.png"),
    "op_before": get_b64("doc_01_operations_before.png"),
    "op_after": get_b64("doc_01_operations_after.png"),
    "fl_before": get_b64("doc_02_fleet_overview_before.png"),
    "fl_after": get_b64("doc_02_fleet_overview_after.png"),
    "se_before": get_b64("doc_03_state_estimation_before.png"),
    "se_after": get_b64("doc_03_state_estimation_after.png"),
    "th_before": get_b64("doc_04_thermal_safety_before.png"),
    "th_after": get_b64("doc_04_thermal_safety_after.png"),
    "dp_before": get_b64("doc_05_driver_profiling_before.png"),
    "dp_after": get_b64("doc_05_driver_profiling_after.png"),
    "kn_before": get_b64("doc_06_knee_prognostics_before.png"),
    "kn_after": get_b64("doc_06_knee_prognostics_after.png"),
    "me_before": get_b64("doc_07_meta_ensemble_before.png"),
    "me_after": get_b64("doc_07_meta_ensemble_after.png"),
}
print("Assets loaded successfully.")
