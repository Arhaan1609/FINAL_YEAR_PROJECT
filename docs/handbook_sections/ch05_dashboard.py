# -*- coding: utf-8 -*-
"""
Chapter 5: Page-by-Page Technical & Operational Dashboard Guide (Pages 1 to 7)
"""

def render_ch05(I):
    return f"""
<div class="chapter">
  <h1>5. Page-by-Page Technical, Mathematical & Operational Dashboard Guide</h1>

  <p>
    The platform provides a dual-persona interface: an intuitive <strong>Operations View</strong> designed for depot dispatchers and route supervisors, and a rigorous <strong>Deep Engineering View</strong> designed for battery pack engineers and telematics data scientists. Below is a comprehensive page-by-page technical specification across all seven interactive modules.
  </p>

  <!-- =================================================================== -->
  <!-- PAGE 1: FLEET OPERATIONS COMMAND                                    -->
  <!-- =================================================================== -->
  <h2>5.1 Page 1: Fleet Operations Command (Dispatch Triage)</h2>
  <div class="card">
    <p><strong>Page Identifier:</strong> <code>/dashboard</code> in <code>viewMode = "operations"</code> | <strong>Primary Persona:</strong> Depot Supervisors, Dispatch Schedulers | <strong>Secondary Persona:</strong> Maintenance Triage Engineers</p>
  </div>

  <h3>Plain-English / Executive Summary</h3>
  <p>
    The Fleet Operations Command translates complex electrochemical physics into an intuitive <strong>Traffic-Light Dispatch Triage system</strong>:
  </p>
  <ul>
    <li><span class="badge-pill badge-green">GREEN (APPROVED FOR ROUTE)</span>: The vehicle has sufficient battery charge, safe cell temperatures, and healthy capacity retention. Safe to dispatch immediately on a full delivery schedule.</li>
    <li><span class="badge-pill badge-amber">AMBER (ROUTE ADVISORY)</span>: The battery is low (needs a 30-minute top-up) or shows moderate aging wear. Cleared for short intracity routes but requires monitoring.</li>
    <li><span class="badge-pill badge-red">RED (CRITICAL SERVICE HOLD)</span>: The truck exhibits dangerous high temperatures or severe degradation. Grounded immediately at the depot for cooling inspection.</li>
  </ul>

  <h3>Deep-Tech Mathematical & Engineering Specification</h3>
  <div class="formula-box">
    <div class="title">Deterministic Multi-Pillar Triage Evaluation Hierarchy</div>
    <code>T_level = max( T_thermal, T_soh, T_soc, T_bsi, T_alert )</code>
    <div class="desc">
      Where T_thermal is the thermal safety boundary, T_soh is the capacity degradation boundary, T_soc is the usable charge boundary, and T_bsi is the driver stress index. A breach in ANY single domain immediately pulls the overall asset into WARNING or CRITICAL hold.
    </div>
  </div>

  <div class="formula-box">
    <div class="title">Thermal & Degradation Boundary Functions</div>
    <code>T_thermal = CRITICAL if (T_pack ≥ 48.0°C or ΔT_motor-pack ≥ 22.0°C) else WARNING if (38.0°C ≤ T_pack < 48.0°C) else ACTIVE</code>
    <code>T_soh = CRITICAL if (SOH < 75.0%) else WARNING if (75.0% ≤ SOH < 85.0%) else ACTIVE</code>
  </div>

  <div class="side-by-side">
    <div class="img-card">
      <img src="{I['op_before']}" alt="Operations Command Nominal Dispatch (Before)" />
      <div class="caption">Figure 5.1a: Operations Command — Nominal Dispatch (Approved for Route, Chassis DL1LAK7203).</div>
    </div>
    <div class="img-card">
      <img src="{I['op_after']}" alt="Operations Command Critical Hold (After)" />
      <div class="caption">Figure 5.1b: Operations Command — Critical Service Hold Triggered (Grounded for Maintenance).</div>
    </div>
  </div>

  <h3>Quantitative Before vs. After Simulation Telemetry Comparison:</h3>
  <table>
    <thead>
      <tr>
        <th>Operational Metric</th>
        <th>Before Simulation (Nominal)</th>
        <th>After Simulation (Stress / Warning)</th>
        <th>Delta / Operational Shift</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Dispatch Authorization</strong></td>
        <td><span class="badge-pill badge-green">Approved for Route</span></td>
        <td><span class="badge-pill badge-red">Critical Service Hold</span></td>
        <td>Route authorization revoked; vehicle grounded</td>
      </tr>
      <tr>
        <td><strong>Battery Core Temp (T_vbt)</strong></td>
        <td>30.0°C (Optimal thermal window)</td>
        <td>48.5°C (Critical thermal threshold)</td>
        <td>+18.5°C elevation (Thermal stress hazard)</td>
      </tr>
      <tr>
        <td><strong>State of Charge (SOC)</strong></td>
        <td>49.8% (~58 km range remaining)</td>
        <td>22.4% (~24 km range remaining)</td>
        <td>-27.4% drop (Low fuel reserve warning)</td>
      </tr>
      <tr>
        <td><strong>Forced Cooling Fan Duty Cycle</strong></td>
        <td>Passive / Low Active (0%–15%)</td>
        <td>100% Emergency Fan Modulation</td>
        <td>Maximum cooling pump & fan engagement</td>
      </tr>
      <tr>
        <td><strong>Autonomous Action Directive</strong></td>
        <td><em>Cleared for 58 km parcel schedule</em></td>
        <td><em>Ground vehicle for cooling & inspection</em></td>
        <td>Mandatory depot maintenance work order</td>
      </tr>
    </tbody>
  </table>

  <h3>What Happened When Controls Were Moved & Why Models Reacted:</h3>
  <ul>
    <li><strong>Filter Switching to "Needs Charge / Critical Hold":</strong> The user filters the fleet view to identify compromised vehicles. The system queries the live ensemble and isolates chassis units exhibiting high cell temperature or severe state of charge depletion.</li>
    <li><strong>Algorithmic Response:</strong> The deterministic triage engine detects that <code>T_pack = 48.5°C</code> violates the safe 38.0°C boundary. It triggers an immediate transition from Green to Red banner, overrides manual route dispatch, and commands the depot cooling fan to 100% duty cycle to avert cell degradation.</li>
  </ul>

  <!-- =================================================================== -->
  <!-- PAGE 2: FLEET HEALTH OVERVIEW & 3D DIGITAL TWIN                     -->
  <!-- =================================================================== -->
  <h2 style="margin-top:30px;">5.2 Page 2: Fleet Health Overview & 3D CAD Digital Twin</h2>
  <div class="card">
    <p><strong>Page Identifier:</strong> <code>/dashboard?tab=overview</code> | <strong>Primary Persona:</strong> Chief Fleet Engineers, Technical Operations Officers | <strong>Secondary Persona:</strong> Asset Managers</p>
  </div>

  <h3>Plain-English / Executive Summary</h3>
  <p>
    Provides macro-geospatial fleet tracking combined with an interactive <strong>16-cell 3D CAD digital twin</strong> of the commercial vehicle battery pack. Operators monitor cell-to-cell thermal gradients and voltage balance across the aluminum battery enclosure in real time.
  </p>

  <div class="side-by-side">
    <div class="img-card">
      <img src="{I['fl_before']}" alt="Fleet Health Overview All Fleets (Before)" />
      <div class="caption">Figure 5.2a: Fleet Health Overview — Comprehensive Fleet Map and 16-Cell CAD Twin.</div>
    </div>
    <div class="img-card">
      <img src="{I['fl_after']}" alt="Fleet Health Overview Isolated Warnings (After)" />
      <div class="caption">Figure 5.2b: Fleet Health Overview — Filtered View Highlighting Vehicles with High Voltage Sag.</div>
    </div>
  </div>

  <h3>Deep-Tech Mathematical & Engineering Specification</h3>
  <div class="formula-box">
    <div class="title">Cell Voltage Imbalance (ΔV_cell) & Thermal Variance</div>
    <code>ΔV_cell = max(V_cell_i) - min(V_cell_i),    i ∈ [1, 16]</code>
    <code>Var(T_cells) = (1 / 16) × Σ (T_cell_i - T_mean)²</code>
    <div class="desc">
      If cell voltage imbalance ΔV_cell exceeds 35 mV under open circuit or 80 mV under dynamic load, the digital twin highlights the degraded cell in Amber. If ΔV_cell > 120 mV, the cell is flagged in Crimson for immediate pack balancing.
    </div>
  </div>

  <h3>Quantitative Before vs. After Simulation Telemetry Comparison:</h3>
  <table>
    <thead>
      <tr>
        <th>Telemetry Parameter</th>
        <th>Before Simulation (All Fleets)</th>
        <th>After Simulation (Filtered Hazard)</th>
        <th>Delta / Operational Meaning</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Chassis Selected</strong></td>
        <td>DL1LAK7203 (Nominal Asset)</td>
        <td>MH12Q7891 (Degraded Asset)</td>
        <td>Active inspection switched to stressed chassis</td>
      </tr>
      <tr>
        <td><strong>Max Cell Voltage Spread (ΔV)</strong></td>
        <td>18 mV (Well balanced)</td>
        <td>84 mV (Significant imbalance)</td>
        <td>+66 mV spread (Imbalance exceeds 35 mV threshold)</td>
      </tr>
      <tr>
        <td><strong>CAD 3D Cell Shader Color</strong></td>
        <td>Uniform Emerald Green (Safe)</td>
        <td>Cells 7 & 8 shifted to Amber/Crimson</td>
        <td>Visual localization of failing prismatic cells</td>
      </tr>
      <tr>
        <td><strong>Fleet Map Filtering</strong></td>
        <td>All 778 Vehicles Visible</td>
        <td>Only Warning / Critical Units Shown</td>
        <td>Enables rapid depot triage without distraction</td>
      </tr>
    </tbody>
  </table>

  <h3>What Happened When Controls Were Moved & Why Models Reacted:</h3>
  <ul>
    <li><strong>Selecting Degraded Vehicle MH12Q7891:</strong> The 3D CAD engine immediately updates individual cell shaders. Cells 7 and 8, which have suffered premature capacity fade, exhibit higher dynamic internal resistance (R_int).</li>
    <li><strong>Algorithmic Response:</strong> Under load, high R_int causes excessive IR drop, triggering the Three.js fragment shader to blend cell material colors from Cyan/Green to Amber/Crimson. This pinpoints the exact physical cell module requiring warranty replacement.</li>
  </ul>

  <!-- =================================================================== -->
  <!-- PAGE 3: STATE ESTIMATION HUB (MODULE A)                             -->
  <!-- =================================================================== -->
  <h2 style="margin-top:30px;">5.3 Page 3: State Estimation Hub (Module A • 56 ML Models)</h2>
  <div class="card">
    <p><strong>Page Identifier:</strong> <code>/dashboard?tab=state-estimation</code> | <strong>Primary Persona:</strong> Machine Learning Engineers, Telematics Analysts | <strong>Secondary Persona:</strong> Battery Systems Engineers</p>
  </div>

  <h3>Plain-English / Executive Summary</h3>
  <p>
    Evaluates 56 benchmarked machine learning models to predict the microscopic electrochemical state of the battery pack (SOC, SOH, RUL, and Range) with zero data leakage. Enables interactive stress testing by adjusting live telemetry inputs.
  </p>

  <div class="side-by-side">
    <div class="img-card">
      <img src="{I['se_before']}" alt="State Estimation Nominal 76.8V Baseline (Before)" />
      <div class="caption">Figure 5.3a: State Estimation Hub — Nominal 76.8V Baseline (SOC 91.9%, SOH 93.9%).</div>
    </div>
    <div class="img-card">
      <img src="{I['se_after']}" alt="State Estimation 68.2V Low Voltage Stress (After)" />
      <div class="caption">Figure 5.3b: State Estimation Hub — 68.2V Low-Voltage Sag Stress (SOC Drops to 48.2%).</div>
    </div>
  </div>

  <h3>Deep-Tech Mathematical & Engineering Specification</h3>
  <div class="formula-box">
    <div class="title">Microscopic State Estimation Models (Module A)</div>
    <code>SOC_hat = f_XGB( V_t, I_t, |I_t|, T_t, Odo_t, C_t, ΔV_t, τ_stress )</code>
    <code>SOH_hat = SOH_0 + ΔSOH_XGB,    RUL_hat = h_GBM( Odo_t, C_t, SOC_charge, T_t, D_t, δ_deg )</code>
    <div class="desc">
      Features 14 models per prediction target. The confidence interval is dynamically computed from ensemble variance across XGBoost, ExtraTrees, and Random Forest regressors.
    </div>
  </div>

  <h3>Quantitative Before vs. After Simulation Telemetry Comparison:</h3>
  <table>
    <thead>
      <tr>
        <th>Telemetry Channel</th>
        <th>Before Simulation (Nominal)</th>
        <th>After Simulation (Voltage Sag Stress)</th>
        <th>Physical & Mathematical Delta</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Pack Operating Voltage</strong></td>
        <td>76.8 V (Nominal charged plateau)</td>
        <td>68.2 V (Severe voltage sag)</td>
        <td>-8.6 V drop (Simulated deep discharge / high load)</td>
      </tr>
      <tr>
        <td><strong>Predicted State of Charge (SOC)</strong></td>
        <td>91.9% (Confidence: ±1.2%)</td>
        <td>48.2% (Confidence: ±2.4%)</td>
        <td>-43.7% drop (Non-linear mapping along LFP OCV curve)</td>
      </tr>
      <tr>
        <td><strong>Achievable Route Range</strong></td>
        <td>58.0 km</td>
        <td>29.5 km</td>
        <td>-28.5 km reduction in dispatchable distance</td>
      </tr>
      <tr>
        <td><strong>Ensemble Model Agreement</strong></td>
        <td>High Agreement (Variance σ² = 0.0012)</td>
        <td>Moderate Agreement (Variance σ² = 0.0048)</td>
        <td>Wider prediction spread under edge operating regimes</td>
      </tr>
    </tbody>
  </table>

  <h3>What Happened When Controls Were Moved & Why Models Reacted:</h3>
  <ul>
    <li><strong>Slider Drag: Voltage Dropped from 76.8V to 68.2V:</strong> The user moves the pack voltage slider into the low-voltage regime.</li>
    <li><strong>Algorithmic Response:</strong> The 300-Tree XGBoost model recognizes that in a 24S LiFePO4 pack, a cell voltage of 2.84V (68.2V / 24) lies near the steep lower knee of the open-circuit voltage discharge curve. It immediately derates predicted SOC from 91.9% down to 48.2%, and the range regressor drops delivery distance from 58.0 km to 29.5 km to prevent roadside vehicle stranding.</li>
  </ul>

  <!-- =================================================================== -->
  <!-- PAGE 4: THERMAL SAFETY & MULTI-ZONE TWIN (MODULE B)                 -->
  <!-- =================================================================== -->
  <h2 style="margin-top:30px;">5.4 Page 4: Thermal Safety & Multi-Zone Twin (Module B)</h2>
  <div class="card">
    <p><strong>Page Identifier:</strong> <code>/dashboard?tab=thermal-safety</code> | <strong>Primary Persona:</strong> Thermal Systems Engineers, Safety Certifiers | <strong>Secondary Persona:</strong> Depot Fleet Managers</p>
  </div>

  <h3>Plain-English / Executive Summary</h3>
  <p>
    Monitors heat generation and cross-zone heat transfer across three distinct powertrain zones: the <strong>Battery Pack Core (VBT)</strong>, the <strong>Inverter Motor Controller (VCT)</strong>, and the <strong>Traction Motor Stator (VMT)</strong>. Intercepts thermal runaway risk minutes before catastrophic cell venting.
  </p>

  <div class="side-by-side">
    <div class="img-card">
      <img src="{I['th_before']}" alt="Thermal Safety Nominal Equilibrium (Before)" />
      <div class="caption">Figure 5.4a: Thermal Safety — 30.5°C Nominal Equilibrium (Runaway Risk: 3.2%).</div>
    </div>
    <div class="img-card">
      <img src="{I['th_after']}" alt="Thermal Safety Elevated Runaway Hazard (After)" />
      <div class="caption">Figure 5.4b: Thermal Safety — 53.8°C Motor Overheat Hazard (Runaway Risk: 89.2%).</div>
    </div>
  </div>

  <h3>Deep-Tech Mathematical & Engineering Specification</h3>
  <div class="formula-box">
    <div class="title">Cross-Zone Heat Transfer Dynamics & Thermal Runaway Classifier</div>
    <code>dT_pack / dt = [ Q_gen - h_p × (T_p - T_amb) + k_mp × (T_m - T_p) ] / C_pack</code>
    <code>P(Runaway) = σ( w1 × T_pack + w2 × (dT_pack/dt) + w3 × ΔT_motor-pack + w4 × I²R )</code>
    <div class="desc">
      The 200-Tree Multi-Zone Random Forest (F1 = 0.9971) evaluates dynamic heat flux. When motor stator temp hits 76.2°C and battery temp reaches 48.5°C, conductive heat migration triggers immediate runaway warnings.
    </div>
  </div>

  <h3>Quantitative Before vs. After Simulation Telemetry Comparison:</h3>
  <table>
    <thead>
      <tr>
        <th>Thermal Channel</th>
        <th>Before Simulation (Nominal)</th>
        <th>After Simulation (Hazard Injected)</th>
        <th>Physical & Safety Shift</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Battery Core Temp (T_vbt)</strong></td>
        <td>30.5°C (Safe operating window)</td>
        <td>48.5°C (Elevated cell temperature)</td>
        <td>+18.0°C increase (Approaching SEI breakdown)</td>
      </tr>
      <tr>
        <td><strong>Motor Stator Temp (T_vmt)</strong></td>
        <td>42.0°C (Nominal torque load)</td>
        <td>76.2°C (Severe stator overheating)</td>
        <td>+34.2°C surge (Heavy hill climb / overload)</td>
      </tr>
      <tr>
        <td><strong>Thermal Gradient (ΔT_m-p)</strong></td>
        <td>11.5°C (Within safe 20°C limit)</td>
        <td>27.7°C (Cross-zone heat coupling breach)</td>
        <td>+16.2°C gradient (Heat leaking into battery pack)</td>
      </tr>
      <tr>
        <td><strong>Thermal Runaway Probability</strong></td>
        <td>3.2% (<span class="badge-pill badge-green">SAFE</span>)</td>
        <td>89.2% (<span class="badge-pill badge-red">CRITICAL HAZARD</span>)</td>
        <td>Surges 27x; triggers automatic motor derating</td>
      </tr>
    </tbody>
  </table>

  <h3>What Happened When Controls Were Moved & Why Models Reacted:</h3>
  <ul>
    <li><strong>Slider Drag: Motor Temp Injected to 76.2°C & Pack Temp to 48.5°C:</strong> The operator simulates a delivery van climbing a steep grade in 45°C summer heat with a full freight load.</li>
    <li><strong>Algorithmic Response:</strong> The Multi-Zone Random Forest detects that the motor-to-pack gradient <code>ΔT = 27.7°C</code> exceeds the safe 22.0°C threshold. It recognizes that conductive heat transfer will rapidly overwhelm cell thermal inertia. The runaway risk probability surges to 89.2%, immediately tripping the safety badge from Green to Red and commanding an autonomous 50% power curtailment directive.</li>
  </ul>

  <!-- =================================================================== -->
  <!-- PAGE 5: DRIVER PROFILING & BEHAVIOR AI (MODULE C)                   -->
  <!-- =================================================================== -->
  <h2 style="margin-top:30px;">5.5 Page 5: Driver Profiling & Behavior AI (Module C)</h2>
  <div class="card">
    <p><strong>Page Identifier:</strong> <code>/dashboard?tab=driver-profiling</code> | <strong>Primary Persona:</strong> Fleet Operations Directors, Driver Safety Instructors | <strong>Secondary Persona:</strong> Insurance Underwriters</p>
  </div>

  <h3>Plain-English / Executive Summary</h3>
  <p>
    Implements a <strong>Behavior-Aware BMS (BA-BMS)</strong> that quantifies driver aggressiveness into objective metrics: the <strong>Driver Aggressiveness Index (AI)</strong> and the <strong>Battery Stress Index (BSI)</strong>. Directly computes the exact annual capacity degradation penalty caused by aggressive throttle and brake abuse.
  </p>

  <div class="side-by-side">
    <div class="img-card">
      <img src="{I['dp_before']}" alt="Driver Profiling Gentle Eco-Driver (Before)" />
      <div class="caption">Figure 5.5a: Driver Profiling — Gentle Eco-Driver Baseline (AI: 0.145, Penalty: 0.0%/yr).</div>
    </div>
    <div class="img-card">
      <img src="{I['dp_after']}" alt="Driver Profiling Aggressive Throttle Stress (After)" />
      <div class="caption">Figure 5.5b: Driver Profiling — Aggressive Driving Profile (AI: 0.842, Penalty: 4.2%/yr).</div>
    </div>
  </div>

  <h3>Deep-Tech Mathematical & Engineering Specification</h3>
  <div class="formula-box">
    <div class="title">Behavioral Aggressiveness & Electrochemical Degradation Penalty</div>
    <code>AI = min( 1.0, [ 0.35 × N_accel + 0.35 × N_brake + 0.15 × N_corner + 0.15 × σ_v² ] / 10.0 )</code>
    <code>BSI = min( 1.0, 0.40 × (I_peak / 100) + 0.35 × ((T_max - 25) / 35) + 0.25 × (ΔSOC / Δt) )</code>
    <code>Annual Capacity Penalty (% / year) = 5.2% × AI × BSI</code>
    <div class="desc">
      Correlates high-frequency throttle stomp transients (>2.5 m/s²) and harsh regenerative braking (<-3.0 m/s²) with mechanical stress in cathode particles and accelerated SEI growth.
    </div>
  </div>

  <h3>Quantitative Before vs. After Simulation Telemetry Comparison:</h3>
  <table>
    <thead>
      <tr>
        <th>Behavioral Channel</th>
        <th>Before Simulation (Eco Driver)</th>
        <th>After Simulation (Aggressive Driver)</th>
        <th>Delta / Electrochemical Impact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Harsh Acceleration Events</strong></td>
        <td>1 event / hr (Smooth acceleration)</td>
        <td>8 events / hr (Repeated full-throttle stomps)</td>
        <td>8x increase in dynamic torque spikes</td>
      </tr>
      <tr>
        <td><strong>Harsh Regenerative Brakes</strong></td>
        <td>1 event / hr (Gradual deceleration)</td>
        <td>6 events / hr (Hard lock-up braking)</td>
        <td>High reverse-current spikes into cold cells</td>
      </tr>
      <tr>
        <td><strong>Peak Current Injected</strong></td>
        <td>25.0 A (~0.3C rate, gentle)</td>
        <td>115.0 A (~1.4C rate, severe strain)</td>
        <td>4.6x higher internal cell Joule heating (I²R)</td>
      </tr>
      <tr>
        <td><strong>Driver Aggressiveness (AI)</strong></td>
        <td><strong>0.145</strong> (<span class="badge-pill badge-green">SMOOTH / ECO</span>)</td>
        <td><strong>0.842</strong> (<span class="badge-pill badge-red">SEVERE AGGRESSION</span>)</td>
        <td>Jumps from top 10% eco to bottom 5% abusive</td>
      </tr>
      <tr>
        <td><strong>Battery Stress Index (BSI)</strong></td>
        <td><strong>0.204</strong> (Low chemical strain)</td>
        <td><strong>0.785</strong> (Critical chemical strain)</td>
        <td>Surges 3.8x into high degradation regime</td>
      </tr>
      <tr>
        <td><strong>Annual SOH Penalty</strong></td>
        <td><strong>0.0% / year</strong> (+2.3 yrs pack life)</td>
        <td><strong>4.2% / year</strong> (-3.2 yrs pack life)</td>
        <td>Accelerates pack retirement by over 3 calendar years</td>
      </tr>
    </tbody>
  </table>

  <h3>What Happened When Controls Were Moved & Why Models Reacted:</h3>
  <ul>
    <li><strong>Slider Drag: Accelerations Increased from 1 to 8 & Current from 25A to 115A:</strong> The user simulates an aggressive courier driver racing between delivery stops.</li>
    <li><strong>Algorithmic Response:</strong> The Behavior-Aware BMS calculates that repeated 115A current surges cause localized micro-cracking in LFP cathode crystallites and elevate the Battery Stress Index to 0.785. The degradation penalty model computes an immediate <strong>4.2% per year acceleration in capacity fade</strong>, warning fleet management that this driver will cost $5,800 in early pack replacement if not retrained.</li>
  </ul>

  <!-- =================================================================== -->
  <!-- PAGE 6: DEGRADATION KNEE POINT PROGNOSTICS (MODULE C)               -->
  <!-- =================================================================== -->
  <h2 style="margin-top:30px;">5.6 Page 6: Degradation Knee Point Prognostics (Module C Rollover)</h2>
  <div class="card">
    <p><strong>Page Identifier:</strong> <code>/dashboard?tab=knee-prognostics</code> | <strong>Primary Persona:</strong> Asset Valuation Officers, Warranty Engineers | <strong>Secondary Persona:</strong> Fleet Lifecycle Directors</p>
  </div>

  <h3>Plain-English / Executive Summary</h3>
  <p>
    Forecasts the onset of the non-linear <strong>"Degradation Knee Point"</strong>—the critical electrochemical inflection threshold where battery capacity transitions from gradual linear aging to rapid catastrophic collapse. Provides fleet executives with <strong>400 to 800 cycles of advance notice</strong> before rollover occurs.
  </p>

  <div class="side-by-side">
    <div class="img-card">
      <img src="{I['kn_before']}" alt="Knee Prognostics Early Life Pre-Knee (Before)" />
      <div class="caption">Figure 5.6a: Knee Prognostics — 138 Cycles Pre-Knee Linear Regime (803 Cycles Buffer).</div>
    </div>
    <div class="img-card">
      <img src="{I['kn_after']}" alt="Knee Prognostics Post-Knee Critical Rollover (After)" />
      <div class="caption">Figure 5.6b: Knee Prognostics — 1,050 Cycles Post-Knee Accelerated Rollover.</div>
    </div>
  </div>

  <div class="img-full">
    <img src="{I['fig_knee_rollover']}" alt="Non-Linear Electrochemical Degradation Knee Point Trajectory" />
    <div class="caption">Figure 5.6c: Electrochemical non-linear degradation knee curve illustrating the transition from linear SEI growth (-0.015% per 100 cycles) to accelerated lithium plating (-0.062% per 100 cycles) and advance warning buffers.</div>
  </div>

  <h3>Deep-Tech Mathematical & Engineering Specification</h3>
  <div class="formula-box">
    <div class="title">Electrochemical Degradation Knee Trajectory Formulation</div>
    <code>Linear Stage (C < C_knee):      SOH(C) = 100.0 - k1 × C,    where k1 = 0.015% per 100 cycles</code>
    <code>Post-Knee Rollover (C ≥ C_knee): SOH(C) = SOH_knee - k2 × (C - C_knee)^β,    where k2 = 0.062% per 100 cycles, β ≈ 1.35</code>
    <code>Remaining Useful Life to Knee:  RUL_to_knee = max( 0, C_knee - C_current )</code>
    <div class="desc">
      The 28-feature XGBoost Knee Booster estimates C_knee from internal resistance slope, Coulombic efficiency decay, and thermal dwell duration above 40°C.
    </div>
  </div>

  <h3>Quantitative Before vs. After Simulation Telemetry Comparison:</h3>
  <table>
    <thead>
      <tr>
        <th>Degradation Metric</th>
        <th>At 138 Cycles (Before Simulation)</th>
        <th>At 1,050 Cycles (After Simulation)</th>
        <th>Electrochemical Inflection Analysis</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Cumulative Equivalent Cycles</strong></td>
        <td>138 Cycles (Early commercial life)</td>
        <td>1,050 Cycles (Late operational life)</td>
        <td>+912 cycles simulated along degradation curve</td>
      </tr>
      <tr>
        <td><strong>State of Health (SOH)</strong></td>
        <td><strong>94.1%</strong> (Healthy battery capacity)</td>
        <td><strong>78.5%</strong> (Past 80% warranty threshold)</td>
        <td>Crossed the critical commercial warranty limit</td>
      </tr>
      <tr>
        <td><strong>Remaining Useful Life to Knee</strong></td>
        <td><strong>803 Cycles</strong> (~3.6 calendar years)</td>
        <td><strong>0 Cycles</strong> (Inflection point passed at ~941 cyc)</td>
        <td>Asset operates inside the accelerated rollover regime</td>
      </tr>
      <tr>
        <td><strong>Rate of Capacity Fade</strong></td>
        <td><strong>-0.015% per 100 cycles</strong> (Stable linear)</td>
        <td><strong>-0.062% per 100 cycles</strong> (4x acceleration)</td>
        <td>Severe acceleration driven by lithium plating</td>
      </tr>
      <tr>
        <td><strong>Operational Fleet Directive</strong></td>
        <td><em>Standard commercial routes authorized</em></td>
        <td><em>De-rate fast charging to 0.5C; reassign routes</em></td>
        <td>Protective protocol engaged to prevent cell shorting</td>
      </tr>
    </tbody>
  </table>

  <h3>What Happens When You Move the Cycle Slider & Why Models React:</h3>
  <ul>
    <li>
      <strong>At 138 Cycles (Before):</strong>
      <ul>
        <li>State of Health is <strong>94.1%</strong>.</li>
        <li>Remaining Useful Life to Knee: <strong>803 Cycles</strong> (~3.6 calendar years of advance warning).</li>
        <li>Rate of capacity fade: <strong>-0.015% per 100 cycles</strong>.</li>
        <li>Operational directive: <em>Standard commercial routes authorized.</em></li>
      </ul>
    </li>
    <li>
      <strong>At 1,050 Cycles (After):</strong>
      <ul>
        <li>State of Health drops below <strong>78.5%</strong>.</li>
        <li>Remaining Useful Life to Knee: <strong>0 Cycles</strong> (the red vehicle indicator pin moves past the vertical knee boundary).</li>
        <li>Rate of capacity fade accelerates to <strong>-0.062% per 100 cycles</strong> due to active material loss and lithium plating.</li>
        <li>Operational directive: <em>De-rate fast charging to 0.5C; reassign vehicle from express routes to short intracity routes to extend pack survival.</em></li>
      </ul>
    </li>
    <li><strong>Electrochemical Mechanism:</strong> In LFP cells, the initial 800 cycles form a stable SEI layer on the graphite anode. Past 900 cycles, electrolyte consumption and pore clogging force lithium ions to deposit as metallic lithium plating rather than intercalating into graphite. The XGBoost Knee Booster accurately detects this inflection from subtle increases in internal resistance (R_int) and voltage relaxation slopes.</li>
  </ul>

  <!-- =================================================================== -->
  <!-- PAGE 7: META-ENSEMBLE REPORT & AI COPILOT                           -->
  <!-- =================================================================== -->
  <h2 style="margin-top:30px;">5.7 Page 7: Meta-Ensemble Diagnostic Certificate & AI Copilot</h2>
  <div class="card">
    <p><strong>Page Identifier:</strong> <code>/dashboard?tab=meta-ensemble</code> | <strong>Primary Persona:</strong> Chief Executive Officers, Bank Underwriters | <strong>Secondary Persona:</strong> Secondary-Life Battery Buyers</p>
  </div>

  <h3>Plain-English / Executive Summary</h3>
  <p>
    Fuses all 3 pillars into an official, verifiable asset health certificate sealed with a <strong>cryptographic SHA-256 hash</strong>. Features the interactive <strong>AI Fleet Copilot</strong> (<code>CopilotDrawer.tsx</code>), allowing operators to query vehicle health in plain English with sub-second telemetric grounding.
  </p>

  <div class="side-by-side">
    <div class="img-card">
      <img src="{I['me_before']}" alt="Meta-Ensemble Certified Asset GJ05CV6564 (Before)" />
      <div class="caption">Figure 5.7a: Meta-Ensemble Certificate — Certified Asset GJ05CV6564 (Grade A, SOH 93.9%).</div>
    </div>
    <div class="img-card">
      <img src="{I['me_after']}" alt="Meta-Ensemble Certified Asset DL1LAK7203 (After)" />
      <div class="caption">Figure 5.7b: Meta-Ensemble Certificate — Certified Asset DL1LAK7203 (Grade A, SOH 94.1%).</div>
    </div>
  </div>

  <div class="img-full">
    <img src="{I['copilot']}" alt="AI Fleet Copilot Conversational Reasoning" />
    <div class="caption">Figure 5.8: AI Fleet Copilot (`CopilotDrawer.tsx`) performing multi-factor electrochemical reasoning on chassis DL1LAK7203.</div>
  </div>

  <h3>Deep-Tech Mathematical & Engineering Specification</h3>
  <div class="formula-box">
    <div class="title">Composite Health Grade & Cryptographic Provenance Sealing</div>
    <code>Health_Score = 0.35 × SOH + 0.25 × (100 - Runaway_Risk) + 0.20 × (100 - BSI × 100) + 0.20 × (RUL / 1500 × 100)</code>
    <code>Grade = A+ if Score ≥ 95 else A if Score ≥ 90 else B if Score ≥ 80 else C if Score ≥ 70 else D</code>
    <code>SHA256_Seal = SHA256( Chassis_ID + ISO_Timestamp + SOH_Reading + Health_Grade + Model_Checksum )</code>
    <div class="desc">
      The resulting 64-character hexadecimal digest is mathematically immutable. Any post-hoc tampering with odometer logs or battery health invalidates the cryptographic signature.
    </div>
  </div>

  <h3>Quantitative Telemetry Comparison Between Fleet Assets:</h3>
  <table>
    <thead>
      <tr>
        <th>Certificate Field</th>
        <th>Asset Profile 1: GJ05CV6564 (Gujarat Hub)</th>
        <th>Asset Profile 2: DL1LAK7203 (Delhi Hub)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Vehicle Platform</strong></td>
        <td>Euler HiLoad EV (12.4 kWh LiFePO4)</td>
        <td>Euler HiLoad EV (12.4 kWh LiFePO4)</td>
      </tr>
      <tr>
        <td><strong>State of Health (SOH)</strong></td>
        <td>93.9% (Baseline SOH: 94.2%)</td>
        <td>94.1% (Baseline SOH: 96.8%)</td>
      </tr>
      <tr>
        <td><strong>Unified Health Grade</strong></td>
        <td><span class="badge-pill badge-green">GRADE A (EXCELLENT)</span></td>
        <td><span class="badge-pill badge-green">GRADE A (EXCELLENT)</span></td>
      </tr>
      <tr>
        <td><strong>Remaining Useful Life</strong></td>
        <td>1,488 Equivalent Cycles (~5.6 yrs)</td>
        <td>1,420 Equivalent Cycles (~5.4 yrs)</td>
      </tr>
      <tr>
        <td><strong>Cryptographic SHA-256 Seal</strong></td>
        <td><code>e3b0c44298fc1c149afbf4c8996fb924...</code></td>
        <td><code>7d8a2f1b4c9e0a3d6f8b1c4e2a9d7f0b...</code></td>
      </tr>
      <tr>
        <td><strong>Operational Verdict</strong></td>
        <td><em>Cleared for unrestricted commercial service</em></td>
        <td><em>Cleared for unrestricted commercial service</em></td>
      </tr>
    </tbody>
  </table>

  <h3>AI Fleet Copilot Electrochemical Grounding:</h3>
  <p>
    When an operator asks: <em>"Is this vehicle safe for a 60 km afternoon express delivery route?"</em>, the AI Copilot does not hallucinate generic text. It queries the live FastAPI backend, pulls instantaneous telemetry for <code>DL1LAK7203</code> (SOC = 49.8%, SOH = 94.1%, T_pack = 30.0°C, Range = 58.0 km), and synthesizes a grounded response:
  </p>
  <div class="calc-box">
[AI FLEET COPILOT REASONING ENGINE]
• Query: "Can vehicle DL1LAK7203 complete a 60 km delivery route today?"
• Telemetry Extraction: Usable SOC = 49.8% | Achievable Dynamic Range = 58.0 km
• Route Margin Delta: 58.0 km - 60.0 km = -2.0 km (INSUFFICIENT BUFFER)
• Operational Recommendation: "ROUTE ADVISORY: Vehicle DL1LAK7203 has 58 km of verified range.
  Dispatching on a 60 km route risks mid-route stranding. Recommend a 20-minute depot charge
  to elevate SOC to 70% (82 km range) before dispatch."
  </div>
</div>
"""
