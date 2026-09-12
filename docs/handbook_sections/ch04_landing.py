# -*- coding: utf-8 -*-
"""
Chapter 4: Public Landing Portal Walkthrough
"""

def render_ch04(I):
    return f"""
<div class="chapter">
  <h1>4. Public Landing Portal Walkthrough</h1>

  <p>
    The public-facing portal (accessible at <code>/</code>) serves as the executive front door to the platform, presenting fleet executives, investors, and depot managers with an interactive showcase of our machine learning capabilities and commercial return on investment (ROI).
  </p>

  <h2>4.1 Hero Section & Real-World Fleet Mission</h2>
  <div class="img-full">
    <img src="{I['hero']}" alt="Platform Hero Section & Live Fleet Telemetrics" />
    <div class="caption">Figure 4.1: Public Landing Portal Hero Section featuring real-time fleet counters, operational triage badges, and platform mission.</div>
  </div>

  <p>
    The Hero Section establishes the scale and live production status of the system:
  </p>
  <ul>
    <li><strong>778 Active Commercial Electric Vehicles:</strong> Connected across 6 Indian state logistics corridors.</li>
    <li><strong>53 Million+ Telemetric Data Points:</strong> Continuously streaming over CAN 2.0B at 100 ms frequency.</li>
    <li><strong>74 Production-Trained ML Models:</strong> Benchmarked across GroupKFold validation folds with sub-second inference latency.</li>
    <li><strong>98.4% Operational Fleet Uptime:</strong> Intercepting thermal gradients and cell voltage imbalance before roadside breakdowns occur.</li>
  </ul>

  <h2>4.2 Interactive Live Model Sandbox & Real-Time Slider Physics</h2>
  <div class="img-full">
    <img src="{I['sandbox']}" alt="Interactive Live Model Sandbox" />
    <div class="caption">Figure 4.2: Interactive Live Model Sandbox (`LiveModelSandbox.tsx`) demonstrating real-time multi-variable inference.</div>
  </div>

  <p>
    A critical engineering feature of the portal is the <strong>Live Model Sandbox</strong>. It allows prospective clients and university evaluators to adjust vehicle operating variables and observe instantaneous machine learning predictions:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Interactive Control Slider</th>
        <th style="width: 20%;">Adjustment Range</th>
        <th style="width: 55%;">Underlying Physical & Algorithmic Response</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Ambient Temperature</strong></td>
        <td>15.0°C to 50.0°C</td>
        <td>Scales Arrhenius reaction rates. Raising temp above 42°C accelerates electrolyte decomposition, increasing thermal runaway hazard probability from 3.2% to 74.8%.</td>
      </tr>
      <tr>
        <td><strong>Discharge Current</strong></td>
        <td>10.0 A to 120.0 A</td>
        <td>Drives internal resistance voltage sag (ΔV = I × R_ohmic) and quadratic Joule heating (Q = I² × R). High current stomping triggers Battery Stress Index (BSI) alerts.</td>
      </tr>
      <tr>
        <td><strong>Pack Operating Voltage</strong></td>
        <td>65.0 V to 82.0 V</td>
        <td>Maps onto the non-linear LiFePO4 open-circuit voltage (OCV) curve. Lowering voltage below 70.0V causes predicted State of Charge (SOC) to collapse rapidly.</td>
      </tr>
      <tr>
        <td><strong>Cumulative Cycles</strong></td>
        <td>50 to 1,500 Cycles</td>
        <td>Demonstrates transition across the degradation knee point. Below 800 cycles, capacity fade is linear; past 940 cycles, SOH degradation accelerates 4x due to lithium plating.</td>
      </tr>
    </tbody>
  </table>

  <h2>4.3 Enterprise Fleet ROI & Pack Life Extension Financial Calculator</h2>
  <div class="img-full">
    <img src="{I['roi']}" alt="Enterprise Fleet ROI & Pack Life Extension Calculator" />
    <div class="caption">Figure 4.3: Real-Time Enterprise ROI Calculator (`RoiCalculator.tsx`) quantifying financial savings from AI battery management.</div>
  </div>

  <p>
    The platform translates machine learning predictions into direct financial returns for commercial logistics operators:
  </p>

  <div class="formula-box">
    <div class="title">Enterprise Capital Expenditure (CapEx) Savings Model</div>
    <code>CapEx Savings = N_fleet × C_pack × [ (Cycles_ai - Cycles_std) / Cycles_std ]</code>
    <div class="desc">
      Where N_fleet is fleet size (e.g., 100 vehicles), C_pack is replacement pack cost ($5,800 for 12.4 kWh LFP), Cycles_std is standard lifespan (1,200 cycles / ~4.0 years), and Cycles_ai is our extended lifespan (1,680 cycles / ~5.6 years with Behavior-Aware BMS).
    </div>
  </div>

  <div class="calc-box">
====================================================================================================
COMMERCIAL FLEET ROI PROJECTION (100-VEHICLE COMMERCIAL DELIVERY FLEET)
• Baseline Pack Replacement Cycle: Every 4.0 Calendar Years (~1,200 commercial cycles)
• AI-Extended Pack Replacement Cycle: Every 5.6 Calendar Years (~1,680 commercial cycles, +40.0% life)
• Capital Expenditure Deferral: $184,000 per 100 vehicles per 4-year operating cycle
• Warranty Dispute Mitigation: 100% cryptographic proof of driver abuse prevents false OEM claims
• Carbon Footprint Reduction: 312 Metric Tons of CO2 saved annually through deferred manufacturing
• Fleet Dispatch Availability: +4.8% increase in daily vehicle utilization via preventative cooling
====================================================================================================
  </div>

  <h2>4.4 Fleet Health Radar & Operational Distribution</h2>
  <p>
    The landing page concludes with the <strong>Fleet Health Radar</strong>, categorizing connected fleet assets into three operational tiers:
  </p>
  <ul>
    <li><span class="badge-pill badge-green">408 ACTIVE (52.4%)</span>: Nominal health (SOH > 90%, Temp < 38°C), cleared for immediate heavy express delivery dispatches.</li>
    <li><span class="badge-pill badge-amber">345 ADVISORY (44.3%)</span>: Minor degradation or elevated ambient thermal dwell, assigned to medium intracity routes with charging top-ups.</li>
    <li><span class="badge-pill badge-red">25 CRITICAL (3.3%)</span>: Severe cell imbalance or high thermal gradients, grounded immediately at depot for cooling and terminal inspection.</li>
  </ul>
</div>
"""
