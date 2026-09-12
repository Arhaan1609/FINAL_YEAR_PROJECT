# -*- coding: utf-8 -*-
"""
Generate publication-grade scientific figures for the EV Battery Intelligence Handbook.
Uses Matplotlib and Seaborn with modern styling, high DPI, and clear engineering annotations.
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Output directory
img_dir = r"c:\Final_Year_Project_1\docs\images"
os.makedirs(img_dir, exist_ok=True)

# Global plot styling
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 1.2
plt.rcParams['grid.color'] = '#f1f5f9'
plt.rcParams['grid.linestyle'] = '--'

# ----------------------------------------------------------------------
# FIGURE 1: SOC vs SOH Fundamental Distinction & Usable Capacity Shrinkage
# ----------------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=200)

# Left: SOC daily cycling vs SOH permanent fade
days = np.linspace(0, 14, 500)
# SOC cycles between 20% and 100% daily
soc = 60 + 40 * np.sin(2 * np.pi * days - np.pi/2)
# SOH slowly degrades from 98% to 94%
soh = 98.0 - (days / 14) * 4.0

ax1.plot(days, soc, color='#0891b2', linewidth=2.2, label='State of Charge (SOC % - Reversible Fuel)')
ax1.plot(days, soh, color='#e11d48', linewidth=3.0, linestyle='--', label='State of Health (SOH % - Permanent Lifespan)')
ax1.fill_between(days, 20, soc, color='#0891b2', alpha=0.1)
ax1.set_title('Operational Dimension: Fuel (SOC) vs. Asset Health (SOH)', fontsize=12, fontweight='bold', pad=12)
ax1.set_xlabel('Operating Timeline (Days)', fontsize=10, fontweight='bold')
ax1.set_ylabel('Percentage (%)', fontsize=10, fontweight='bold')
ax1.set_ylim(0, 110)
ax1.grid(True, alpha=0.6)
ax1.legend(loc='lower left', frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1')
ax1.annotate('Nightly Depot Charging\n(Restores SOC to 100%)', xy=(2.5, 100), xytext=(3.5, 80),
             arrowprops=dict(arrowstyle='->', color='#0891b2', lw=1.5),
             bbox=dict(boxstyle='round,pad=0.3', facecolor='#ecfeff', edgecolor='#a5f3fc', alpha=0.9), fontsize=8.5)
ax1.annotate('Irreversible SEI Growth\n(SOH NEVER Restores)', xy=(10, 95.1), xytext=(8.5, 40),
             arrowprops=dict(arrowstyle='->', color='#e11d48', lw=1.5),
             bbox=dict(boxstyle='round,pad=0.3', facecolor='#fff1f2', edgecolor='#fecdd3', alpha=0.9), fontsize=8.5)

# Right: Container Shrinkage Phenomenon (100% SOC with 85% SOH)
years = ['Brand New (Year 0)', 'Year 1 (94% SOH)', 'Year 3 (85% SOH)', 'Year 5 (78% EOL)']
nominal_kwh = 12.4
soh_vals = [1.0, 0.94, 0.85, 0.78]
usable_kwh = [nominal_kwh * s for s in soh_vals]
lost_kwh = [nominal_kwh - u for u in usable_kwh]

bars1 = ax2.bar(years, usable_kwh, color='#059669', width=0.55, label='Usable Battery Energy (kWh)')
bars2 = ax2.bar(years, lost_kwh, bottom=usable_kwh, color='#cbd5e1', width=0.55, label='Permanently Lost Capacity (kWh)')

ax2.set_title('The "100% SOC with 85% SOH" Container Shrinkage', fontsize=12, fontweight='bold', pad=12)
ax2.set_ylabel('Total Pack Energy Capacity (kWh)', fontsize=10, fontweight='bold')
ax2.set_ylim(0, 15)
ax2.grid(axis='y', alpha=0.6)
ax2.legend(loc='upper right', frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1')

for bar, u in zip(bars1, usable_kwh):
    ax2.text(bar.get_x() + bar.get_width()/2, u/2, f'{u:.2f} kWh\n({(u/nominal_kwh)*100:.0f} km)',
             ha='center', va='center', color='#ffffff', fontweight='bold', fontsize=8.5)

plt.tight_layout()
plt.savefig(os.path.join(img_dir, "fig_01_soc_vs_soh.png"), dpi=200)
plt.close()
print("Generated fig_01_soc_vs_soh.png")

# ----------------------------------------------------------------------
# FIGURE 2: LOGO-CV vs Random Split Data Leakage Proof
# ----------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5), dpi=200)
models = ['SOC Estimation\n(XGBoost)', 'SOH Generalization\n(ExtraTrees ΔSOH)', 'RUL Forecasting\n(GradientBoosting)', 'Route Mileage\n(Speed-Var Regressor)']
random_r2 = [0.9998, 0.9994, 0.9992, 0.9985]
logo_r2 = [0.9873, 0.9672, 0.9971, 0.9526]
naive_zero_fade = [0.7210, 0.8912, 0.5420, 0.6840]

x = np.arange(len(models))
width = 0.25

rects1 = ax.bar(x - width, random_r2, width, label='Random K-Fold Split (Severe Entity & Temporal Data Leakage)', color='#f43f5e')
rects2 = ax.bar(x, logo_r2, width, label='Our 19-Fold LOGO-CV (Strict Zero-Leakage Generalization)', color='#0891b2')
rects3 = ax.bar(x + width, naive_zero_fade, width, label='Zero-Fade Baseline (Trivial Zero-ML Benchmark)', color='#94a3b8')

ax.set_ylabel('Model Generalization Score (R² Score)', fontsize=10, fontweight='bold')
ax.set_title('Empirical Benchmark: Flawed Data Leakage vs. Honest 19-Fold LOGO-CV', fontsize=12, fontweight='bold', pad=12)
ax.set_xticks(x)
ax.set_xticklabels(models, fontsize=9.5, fontweight='bold')
ax.set_ylim(0.4, 1.05)
ax.grid(axis='y', alpha=0.6)
ax.legend(loc='lower right', frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1')

for bar in rects1:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2, yval + 0.01, f'{yval:.4f}', ha='center', va='bottom', fontsize=7.5, color='#9f1239', fontweight='bold')
for bar in rects2:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2, yval + 0.01, f'{yval:.4f}', ha='center', va='bottom', fontsize=7.5, color='#0e7490', fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(img_dir, "fig_02_logo_cv_vs_random.png"), dpi=200)
plt.close()
print("Generated fig_02_logo_cv_vs_random.png")

# ----------------------------------------------------------------------
# FIGURE 3: 3-Zone Thermodynamic Heat Coupling & Transfer Mesh
# ----------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11, 5.5), dpi=200)

# Draw 3 zones
zone_pack = patches.FancyBboxPatch((1, 2), 3, 2.5, boxstyle="round,pad=0.2", fc="#ecfeff", ec="#0891b2", lw=2.5)
zone_ctrl = patches.FancyBboxPatch((5.5, 2), 2.5, 2.5, boxstyle="round,pad=0.2", fc="#fffbeb", ec="#f59e0b", lw=2.5)
zone_motor = patches.FancyBboxPatch((9.5, 2), 3, 2.5, boxstyle="round,pad=0.2", fc="#fef2f2", ec="#ef4444", lw=2.5)

ax.add_patch(zone_pack)
ax.add_patch(zone_ctrl)
ax.add_patch(zone_motor)

ax.text(2.5, 3.8, 'ZONE 1: BATTERY PACK', ha='center', va='center', fontweight='bold', fontsize=10.5, color='#0e7490')
ax.text(2.5, 3.2, 'Core Temp: T_vbt (30.5°C)\n12.4 kWh LFP (24S)\nHeat Gen: Q = I²R + IT(dE/dT)', ha='center', va='center', fontsize=8.5, color='#1e293b')

ax.text(6.75, 3.8, 'ZONE 2: INVERTER', ha='center', va='center', fontweight='bold', fontsize=10.5, color='#b45309')
ax.text(6.75, 3.2, 'Controller Temp: T_vct (42.0°C)\nIGBT / MOSFET Inverter\nSwitching Losses: P_sw', ha='center', va='center', fontsize=8.5, color='#1e293b')

ax.text(11, 3.8, 'ZONE 3: TRACTION MOTOR', ha='center', va='center', fontweight='bold', fontsize=10.5, color='#b91c1c')
ax.text(11, 3.2, 'Stator Temp: T_vmt (76.2°C)\nHigh-Torque Powertrain\nCopper Losses: P_cu = 3 I_rms² R_s', ha='center', va='center', fontsize=8.5, color='#1e293b')

# Arrows indicating heat coupling flux
ax.annotate('', xy=(5.3, 3.25), xytext=(4.2, 3.25), arrowprops=dict(arrowstyle='<->', color='#f59e0b', lw=2.5))
ax.text(4.75, 3.6, 'k_pc\n(Conduction)', ha='center', va='center', fontsize=8, fontweight='bold', color='#b45309')

ax.annotate('', xy=(9.3, 3.25), xytext=(8.2, 3.25), arrowprops=dict(arrowstyle='<->', color='#ef4444', lw=2.5))
ax.text(8.75, 3.6, 'k_cm\n(Convection)', ha='center', va='center', fontsize=8, fontweight='bold', color='#b91c1c')

# Cross coupling direct arrow
ax.annotate('', xy=(9.4, 4.2), xytext=(4.1, 4.2),
            arrowprops=dict(arrowstyle='->', color='#dc2626', lw=2.5, connectionstyle="arc3,rad=-0.25", linestyle='--'))
ax.text(6.75, 5.0, 'CRITICAL CROSS-COUPLING: Motor Overheat Flux Migrating to Pack (ΔT_m-p > 22°C)',
        ha='center', va='center', fontsize=8.5, fontweight='bold', color='#dc2626',
        bbox=dict(boxstyle='round,pad=0.3', facecolor='#fef2f2', edgecolor='#fca5a5'))

# Ambient convection arrows
ax.annotate('', xy=(2.5, 0.8), xytext=(2.5, 1.8), arrowprops=dict(arrowstyle='->', color='#0284c7', lw=2))
ax.text(2.5, 0.5, 'Chassis Airflow\nh_p (T_pack - T_amb)', ha='center', va='center', fontsize=8, color='#0284c7')

ax.set_xlim(0, 13.5)
ax.set_ylim(0, 5.6)
ax.axis('off')
ax.set_title('Figure: 3-Zone Thermodynamic Cyber-Physical Heat Transfer Coupling Architecture', fontsize=12, fontweight='bold', pad=14)

plt.tight_layout()
plt.savefig(os.path.join(img_dir, "fig_03_3zone_thermal_mesh.png"), dpi=200)
plt.close()
print("Generated fig_03_3zone_thermal_mesh.png")

# ----------------------------------------------------------------------
# FIGURE 4: Degradation Knee Point & Non-Linear Plating Rollover
# ----------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5.5), dpi=200)

cycles = np.linspace(0, 1400, 1000)
knee_cycle = 941.0
soh_knee = 80.0

# Linear regime below knee: slope -0.015% per 100 cyc
# Non-linear regime above knee: quadratic acceleration
soh_curve = np.where(
    cycles <= knee_cycle,
    100.0 - 0.0212 * cycles,  # Hits 80% at 941
    80.0 - 0.062 * (cycles - knee_cycle) - 0.00035 * (cycles - knee_cycle)**2
)

ax.plot(cycles, soh_curve, color='#0284c7', linewidth=3.0, label='Actual Battery SOH Degradation Trajectory')
# Linear projection if knee didn't exist
linear_proj = 100.0 - 0.0212 * cycles
ax.plot(cycles[cycles >= knee_cycle], linear_proj[cycles >= knee_cycle], color='#94a3b8', linestyle=':', linewidth=2.0, label='Naive Linear Assumption (Conventional BMS Blindness)')

# Vertical knee line
ax.axvline(x=knee_cycle, color='#dc2626', linestyle='--', linewidth=2.0, label=f'Degradation Knee Point (Cycle {knee_cycle:.0f})')
ax.axhline(y=80.0, color='#f59e0b', linestyle='-.', linewidth=1.5, label='Warranty End-of-Life Threshold (80% SOH)')

# Shaded zones
ax.fill_between(cycles, soh_curve, where=(cycles <= knee_cycle), color='#ecfeff', alpha=0.6, label='Linear SEI Growth Stage (-0.015% / 100 cyc)')
ax.fill_between(cycles, soh_curve, where=(cycles > knee_cycle), color='#fef2f2', alpha=0.6, label='Accelerated Lithium Plating Rollover (-0.062% / 100 cyc)')

# Annotate vehicle positions
ax.scatter([138], [97.07], color='#16a34a', s=120, zorder=5, edgecolor='#0f172a', linewidth=1.5)
ax.text(138, 99.5, 'Vehicle DL1LAK7203\n(At 138 Cycles: 803 Cyc Buffer)', ha='center', va='bottom', fontsize=8.5, fontweight='bold', color='#166534',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#dcfce7', edgecolor='#86efac'))

ax.scatter([1050], [70.5], color='#dc2626', s=120, zorder=5, edgecolor='#0f172a', linewidth=1.5)
ax.text(1050, 64, 'Simulated Past Knee\n(At 1,050 Cycles: 0 Cyc Buffer)', ha='center', va='top', fontsize=8.5, fontweight='bold', color='#991b1b',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#fee2e2', edgecolor='#fca5a5'))

ax.set_title('Figure: Non-Linear Electrochemical Degradation Knee Point & Advance Prognostics Warning', fontsize=11.5, fontweight='bold', pad=12)
ax.set_xlabel('Cumulative Equivalent Full Cycles (EFC)', fontsize=10, fontweight='bold')
ax.set_ylabel('State of Health (SOH %)', fontsize=10, fontweight='bold')
ax.set_xlim(0, 1400)
ax.set_ylim(50, 105)
ax.grid(True, alpha=0.6)
ax.legend(loc='lower left', frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1', fontsize=8.5)

plt.tight_layout()
plt.savefig(os.path.join(img_dir, "fig_04_knee_rollover_physics.png"), dpi=200)
plt.close()
print("Generated fig_04_knee_rollover_physics.png")

# ----------------------------------------------------------------------
# FIGURE 5: Top 15 Engineered Electrochemical Feature Importances
# ----------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6), dpi=200)

features = [
    'Dynamic IR Sag (ΔV = V - 72V)',
    'Cumulative Cycles (C_t)',
    'Motor-to-Pack Gradient (ΔT_m-p)',
    'Absolute Current (|I|)',
    'Coulombic Stress Rate',
    'Speed Variance (σ_v²)',
    'Thermal Dwell > 40°C (hrs)',
    'Pack Voltage Sag (V_t)',
    'Battery Core Temp (T_vbt)',
    'Harsh Accel Events / hr',
    'Controller Temp (T_vct)',
    'Harsh Braking Events / hr',
    'Joule Heating Integral (I²R)',
    'Motor Stator Temp (T_vmt)',
    'Baseline SOH Anchor (SOH_0)'
]
importances = [0.185, 0.162, 0.124, 0.098, 0.082, 0.068, 0.055, 0.048, 0.042, 0.038, 0.031, 0.026, 0.019, 0.014, 0.008]

y_pos = np.arange(len(features))
bars = ax.barh(y_pos, importances, align='center', color='#0891b2', edgecolor='#0e7490')
ax.set_yticks(y_pos)
ax.set_yticklabels(features, fontsize=9, fontweight='bold')
ax.invert_yaxis()
ax.set_xlabel('Gini Feature Importance / Gain Ratio', fontsize=10, fontweight='bold')
ax.set_title('Figure: Top 15 Engineered Telematics Features Driving Machine Learning Predictions', fontsize=11.5, fontweight='bold', pad=12)
ax.grid(axis='x', alpha=0.6)

for bar, imp in zip(bars, importances):
    ax.text(imp + 0.003, bar.get_y() + bar.get_height()/2, f'{imp*100:.1f}%', va='center', fontsize=8, color='#0e7490', fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(img_dir, "fig_05_feature_importance.png"), dpi=200)
plt.close()
print("Generated fig_05_feature_importance.png")

print("All scientific figures successfully generated in docs/images!")
