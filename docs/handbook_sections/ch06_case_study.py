# -*- coding: utf-8 -*-
"""
Chapter 6: Comprehensive Commercial Vehicle Case Study: DL1LAK7203
"""

def render_ch06():
    return """
<div class="chapter">
  <h1>6. Comprehensive Commercial Vehicle Case Study: DL1LAK7203</h1>

  <p>
    To demonstrate how the platform functions in daily commercial operations, we present an exhaustive case study on an active fleet asset operating within the Delhi NCR logistics corridor:
  </p>

  <div class="card card-highlight">
    <h3 style="margin-top:0; color:#0e7490;">Vehicle Asset Baseline Specifications</h3>
    <ul>
      <li><strong>Chassis Identifier:</strong> <code>DL1LAK7203</code></li>
      <li><strong>Vehicle Platform:</strong> Euler HiLoad Commercial EV (Class: LCV 3-Wheeler)</li>
      <li><strong>Operating Hub:</strong> Delhi Central Depot (Express Courier & E-Commerce Logistics)</li>
      <li><strong>Battery Pack Architecture:</strong> 12.4 kWh Lithium Iron Phosphate (LiFePO4), 24S prismatic arrangement, 76.8V nominal</li>
      <li><strong>Odometer Reading:</strong> 8,004 km | <strong>Cumulative Cycles:</strong> 138 Equivalent Full Cycles (EFC)</li>
      <li><strong>Commissioned Baseline SOH:</strong> 96.8% | <strong>Current Dynamic SOH:</strong> 94.1%</li>
      <li><strong>Primary Assigned Driver:</strong> Driver Unit DL-7203 (Eco Driving Profile)</li>
    </ul>
  </div>

  <h2>6.1 Multi-Scenario Stress Testing (Scenarios A through D)</h2>
  <p>
    We evaluate chassis <code>DL1LAK7203</code> across four realistic operational scenarios to observe how our 74 machine learning models respond to thermodynamic, electrochemical, and behavioral stress:
  </p>

  <ul>
    <li><strong>Scenario A: Nominal Morning Intracity Delivery:</strong> Early morning dispatch (ambient temp: 24.0°C), moderate traffic, smooth driver throttle habits, 350 kg freight load.</li>
    <li><strong>Scenario B: Severe Afternoon Summer Highway Overload:</strong> Peak June afternoon dispatch (ambient temp: 45.2°C), high-speed highway bypass driving, full 680 kg payload, continuous fast discharge.</li>
    <li><strong>Scenario C: Simulated Long-Term Aging Progression (Past Knee):</strong> Fast-forwarding cumulative cycles from 138 cycles to 1,050 cycles to observe non-linear capacity drop-off.</li>
    <li><strong>Scenario D: Driver Behavioral Abuse Impact:</strong> Swapping the calm eco-driver for an aggressive driver stomping full throttle (115A spikes) and hard regenerative braking.</li>
  </ul>

  <h2>6.2 Comprehensive Telemetry Sensitivity Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>Telemetry Channel</th>
        <th>Scenario A: Morning Nominal</th>
        <th>Scenario B: Summer Overload</th>
        <th>Scenario C: Post-Knee Aging</th>
        <th>Scenario D: Driver Abuse</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Pack Voltage (V)</strong></td>
        <td>76.2 V (Nominal)</td>
        <td>68.4 V (Severe IR Sag)</td>
        <td>74.8 V (Elevated IR)</td>
        <td>69.8 V (Transient Sag)</td>
      </tr>
      <tr>
        <td><strong>Pack Current (I)</strong></td>
        <td>28.5 A (~0.35C)</td>
        <td>85.0 A (~1.05C continuous)</td>
        <td>28.5 A (~0.35C)</td>
        <td>115.0 A (1.42C peak spikes)</td>
      </tr>
      <tr>
        <td><strong>Battery Core Temp (T_vbt)</strong></td>
        <td>29.5°C (Optimal)</td>
        <td>48.5°C (Thermal Stress)</td>
        <td>32.0°C (Normal)</td>
        <td>41.2°C (Joule Heating)</td>
      </tr>
      <tr>
        <td><strong>Motor Stator Temp (T_vmt)</strong></td>
        <td>38.0°C (Nominal)</td>
        <td>76.2°C (Stator Overheat)</td>
        <td>38.0°C (Nominal)</td>
        <td>62.5°C (High Torque Heat)</td>
      </tr>
      <tr>
        <td><strong>Thermal Gradient (ΔT_m-p)</strong></td>
        <td>8.5°C (Safe)</td>
        <td><strong>27.7°C</strong> (Hazard)</td>
        <td>6.0°C (Safe)</td>
        <td>21.3°C (Elevated)</td>
      </tr>
      <tr>
        <td><strong>State of Charge (SOC)</strong></td>
        <td>91.9%</td>
        <td>48.2%</td>
        <td>91.9%</td>
        <td>64.0%</td>
      </tr>
      <tr>
        <td><strong>State of Health (SOH)</strong></td>
        <td>94.1%</td>
        <td>93.8%</td>
        <td><strong>78.5%</strong> (Past 80% EOL)</td>
        <td>93.2% (Accelerating)</td>
      </tr>
      <tr>
        <td><strong>Remaining Useful Life (RUL)</strong></td>
        <td>1,420 Cycles (~5.4 yrs)</td>
        <td>1,380 Cycles (~5.2 yrs)</td>
        <td><strong>210 Cycles</strong> (~0.8 yrs)</td>
        <td>980 Cycles (~3.7 yrs)</td>
      </tr>
      <tr>
        <td><strong>Driver Aggressiveness (AI)</strong></td>
        <td>0.145 (<span class="badge-pill badge-green">Eco</span>)</td>
        <td>0.420 (Moderate)</td>
        <td>0.145 (<span class="badge-pill badge-green">Eco</span>)</td>
        <td><strong>0.842</strong> (<span class="badge-pill badge-red">Severe</span>)</td>
      </tr>
      <tr>
        <td><strong>Battery Stress Index (BSI)</strong></td>
        <td>0.204 (Low)</td>
        <td><strong>0.845</strong> (Critical Strain)</td>
        <td>0.312 (Moderate)</td>
        <td><strong>0.785</strong> (High Strain)</td>
      </tr>
      <tr>
        <td><strong>Thermal Runaway Hazard</strong></td>
        <td>3.2% (<span class="badge-pill badge-green">Safe</span>)</td>
        <td><strong>89.2%</strong> (<span class="badge-pill badge-red">Critical</span>)</td>
        <td>4.8% (<span class="badge-pill badge-green">Safe</span>)</td>
        <td>28.4% (Warning)</td>
      </tr>
      <tr>
        <td><strong>Unified Health Grade</strong></td>
        <td><span class="badge-pill badge-green">GRADE A (94.1)</span></td>
        <td><span class="badge-pill badge-red">GRADE D (64.2)</span></td>
        <td><span class="badge-pill badge-amber">GRADE C (72.8)</span></td>
        <td><span class="badge-pill badge-amber">GRADE B (81.4)</span></td>
      </tr>
      <tr>
        <td><strong>Autonomous Action Directive</strong></td>
        <td><em>Cleared for full route</em></td>
        <td><em>Ground for cooling immediately</em></td>
        <td><em>Derate charge to 0.5C; reassign</em></td>
        <td><em>Driver retraining; 4.2%/yr loss</em></td>
      </tr>
    </tbody>
  </table>

  <h2>6.3 Electrochemical Root-Cause Sensitivity Breakdown</h2>
  <p>
    The quantitative shifts observed in the sensitivity matrix demonstrate why our machine learning platform succeeds where rule-based BMS fail:
  </p>

  <div class="card card-highlight">
    <h3 style="margin-top:0; color:#0e7490;">Why Scenario B (Summer Overload) Trips Emergency Runaway Directives</h3>
    <p>
      In Scenario B, ambient temperature of 45.2°C combined with an 85A continuous draw causes motor stator temperature to reach 76.2°C. The thermal gradient between motor and pack expands to 27.7°C. The <strong>Multi-Zone Thermal Random Forest</strong> recognizes that convective cooling airflow through the chassis underbody is insufficient to dissipate this combined flux. It calculates an <strong>89.2% thermal runaway risk probability</strong> and commands an immediate service hold, preventing thermal runaway while the vehicle is on the highway.
    </p>
  </div>

  <div class="card card-warning">
    <h3 style="margin-top:0; color:#b45309;">Why Scenario C (Post-Knee Aging) Accelerates Capacity Fade 4x</h3>
    <p>
      At 138 cycles (Scenario A), internal resistance is low (R_int = 18.2 mΩ) and the cell operates in the linear SEI growth regime (-0.015% per 100 cycles fade rate). Fast-forwarded to 1,050 cycles (Scenario C), cumulative active lithium loss has depleted available electrolyte reserves. The <strong>XGBoost Knee Booster</strong> detects that internal resistance has climbed to 42.8 mΩ and capacity fade has accelerated 4x to <strong>-0.062% per 100 cycles</strong> due to lithium plating. The platform automatically restricts fast charging to 0.5C to prevent dendrite shorting.
    </p>
  </div>

  <div class="card card-danger">
    <h3 style="margin-top:0; color:#b91c1c;">Why Scenario D (Driver Abuse) Costs $5,800 in Pack Replacement</h3>
    <p>
      In Scenario D, repeated full-throttle stomp transients (115A spikes) generate severe mechanical stress in LFP cathode crystallites and quadratic Joule heating (Q = I²R). The <strong>Behavior-Aware BMS</strong> computes an Aggressiveness Index of 0.842 and Battery Stress Index of 0.785. The degradation penalty model computes an annual capacity loss penalty of <strong>4.2% / year</strong>, reducing asset lifespan from 5.4 years down to 3.7 years—costing the fleet operator an early $5,800 battery replacement.
    </p>
  </div>

  <h2>6.4 Full 24-Hour Operational Delivery Route Lifecycle Timeline</h2>
  <p>
    Below is the complete chronological operational timeline for chassis <code>DL1LAK7203</code> during an active 24-hour delivery deployment cycle in Delhi NCR:
  </p>

  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Route Phase / Event</th>
        <th>Speed & Payload</th>
        <th>Pack Temp (T_vbt)</th>
        <th>SOC (%)</th>
        <th>AI / BSI Score</th>
        <th>Platform Autonomous Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>06:00 AM</strong></td>
        <td>Depot Morning Dispatch</td>
        <td>0 km/h | 450 kg parcel load</td>
        <td>22.4°C (Cold Start)</td>
        <td>98.5%</td>
        <td>AI: 0.05 | BSI: 0.10</td>
        <td><span class="badge-pill badge-green">Green</span>: Cleared for 72 km full route.</td>
      </tr>
      <tr>
        <td><strong>08:30 AM</strong></td>
        <td>Urban Stop-and-Go (Connaught Place)</td>
        <td>18 km/h avg | 35 deliveries</td>
        <td>31.2°C (Warming)</td>
        <td>78.4%</td>
        <td>AI: 0.18 | BSI: 0.22</td>
        <td>Normal passive thermal dissipation.</td>
      </tr>
      <tr>
        <td><strong>11:45 AM</strong></td>
        <td>Highway Transit (Outer Ring Road)</td>
        <td>55 km/h continuous cruise</td>
        <td>37.8°C (Nominal cruise)</td>
        <td>54.2%</td>
        <td>AI: 0.12 | BSI: 0.28</td>
        <td>Range regressor updates delivery buffer to 42 km.</td>
      </tr>
      <tr>
        <td><strong>02:15 PM</strong></td>
        <td>Peak Ambient Depot 1C Top-Up</td>
        <td>Plugged into 60 kW DC Fast Charger</td>
        <td>43.8°C (Charging Heat)</td>
        <td>85.0% (Charged)</td>
        <td>AI: 0.00 | BSI: 0.65</td>
        <td><span class="badge-pill badge-amber">Amber</span>: Triggers forced cooling fan at 100%.</td>
      </tr>
      <tr>
        <td><strong>05:30 PM</strong></td>
        <td>Afternoon Heavy Freight Delivery</td>
        <td>25 km/h avg | 28 deliveries</td>
        <td>39.5°C (Cooling active)</td>
        <td>42.0%</td>
        <td>AI: 0.24 | BSI: 0.35</td>
        <td>Cleared for local intracity depot return route.</td>
      </tr>
      <tr>
        <td><strong>08:30 PM</strong></td>
        <td>Evening Depot Return & Audit</td>
        <td>Parked at Central Depot bay 14</td>
        <td>29.8°C (Resting)</td>
        <td>24.8%</td>
        <td>AI: 0.14 | BSI: 0.20</td>
        <td><span class="badge-pill badge-green">Grade A</span>: Computes SHA-256 seal; initiates overnight slow charge.</td>
      </tr>
    </tbody>
  </table>
</div>
"""
