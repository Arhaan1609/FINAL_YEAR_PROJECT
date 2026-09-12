# -*- coding: utf-8 -*-
"""
Chapter 7: Data Sentinel Framework, 3D Digital Twin & Deployment
"""

def render_ch07():
    return """
<div class="chapter">
  <h1>7. Data Sentinel Framework, 3D Digital Twin & Deployment</h1>

  <p>
    An enterprise telematics platform must not only deliver high-accuracy machine learning predictions, but also maintain absolute <strong>data integrity</strong>, real-world <strong>hardware compatibility</strong>, and <strong>sub-second streaming throughput</strong>.
  </p>

  <h2>7.1 Anti-Mocking Architecture: Eliminating Silent Fallbacks</h2>
  <div class="card card-danger">
    <h3 style="margin-top:0; color:#b91c1c;">The Danger of Silent Data Fabrication in Fleet Telematics</h3>
    <p>
      In many commercial IoT products, when a telematics device experiences network packet drops or an analog thermistor disconnects, the software silently falls back to hardcoded default values (e.g., assuming 25.0°C and 80.0% SOC).
    </p>
    <p>
      <strong>In safety-critical battery systems, silent fallbacks are lethal:</strong> If a battery core temperature sensor fails open-circuit while cells are overheating at 52°C, a system that falls back to 25.0°C will permit the vehicle to continue fast charging, resulting in catastrophic fire.
    </p>
  </div>

  <p>
    To eliminate this vulnerability, we engineered a deterministic <strong>Data Sentinel Framework</strong> (<code>modules/module_b/src/sentinel.py</code>) that validates every incoming CAN packet before it reaches the inference models:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Sentinel Validation Layer</th>
        <th style="width: 35%;">Mathematical / Logical Rule</th>
        <th style="width: 40%;">Autonomous Protective Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Physical Bound Check</strong></td>
        <td><code>V ∈ [45.0V, 92.0V], I ∈ [-200A, +200A], T ∈ [-20°C, +95°C]</code></td>
        <td>Values outside physical limits trigger <code>SENSOR_FAULT_OUT_OF_BOUNDS</code>. Rejects packet; flags sensor for diagnostic repair.</td>
      </tr>
      <tr>
        <td><strong>Rate-of-Change Check</strong></td>
        <td><code>|dT / dt| > 2.5°C/s,    |dV / dt| > 15.0V/s</code></td>
        <td>Unphysical step jumps indicate loose wiring or EMI noise. Triggers <code>TRANSIENT_SPIKE_REJECT</code>; holds last verified state with timeout.</td>
      </tr>
      <tr>
        <td><strong>Cross-Sensor Consistency</strong></td>
        <td><code>|I| > 40A AND |dV/dt| < 0.05V/s (No voltage sag under high current)</code></td>
        <td>Current sensor disconnect or stuck voltage reading. Triggers <code>ELECTRICAL_INCONSISTENCY_FAULT</code>; grounds vehicle.</td>
      </tr>
      <tr>
        <td><strong>Cryptographic Audit Seal</strong></td>
        <td><code>SHA256( Chassis + Timestamp + SOH + Grade + Model_Weights )</code></td>
        <td>Generates an immutable 64-character hash. Any post-hoc odometer tampering or manual DB modification breaks the hash verification.</td>
      </tr>
    </tbody>
  </table>

  <h2>7.2 Three.js 16-Cell Prismatic CAD Digital Twin & Shader Mechanics</h2>
  <div class="card card-highlight">
    <h3 style="margin-top:0; color:#0e7490;">Cyber-Physical Dual-State Shader Engine</h3>
    <p>
      The platform features an interactive 3D CAD digital twin (<code>components/digital-twin/BatteryPackCanvas.tsx</code>) rendering an authentic 16-cell prismatic battery tray encased in die-cast aluminum:
    </p>
    <ul>
      <li><strong>Thermodynamic Heat Shader:</strong> Maps individual cell thermistor temperatures to dynamic GLSL fragment shaders. Cells below 32°C render in cool Cyan; cells warming between 35°C and 45°C shift to Amber; cells exceeding 48°C flash in pulsating Crimson to signal localized hotspot formation.</li>
      <li><strong>Electrochemical Capacity Wear Shader:</strong> Shaders blend cell material wear hues reflecting permanent SOH degradation (Emerald Green for >90% SOH, Ochre for 80%–90%, and Weathered Rose for <75% SOH), visually pinpointing aged modules during depot overhaul.</li>
      <li><strong>Interactive Inspection:</strong> Fleet technicians can rotate the 3D pack in full 360° orbit, zoom into specific cell terminals, and inspect sub-millivolt balancing spreads.</li>
    </ul>
  </div>

  <h2>7.3 Production Software Stack & Edge Hardware Integration</h2>
  <table>
    <thead>
      <tr>
        <th>Architectural Layer</th>
        <th>Technologies Deployed</th>
        <th>Production Performance Metrics</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Vehicle Edge Telematics</strong></td>
        <td>ESP32 Microcontroller / Raspberry Pi 4 + MCP2515 CAN 2.0B Transceiver + Quectel 4G LTE Modem</td>
        <td>100 ms CAN frame sampling; sub-15 ms on-vehicle buffer serialization.</td>
      </tr>
      <tr>
        <td><strong>High-Throughput Ingestion</strong></td>
        <td>FastAPI Asynchronous Gateway + Python 3.11 + WebSocket Streaming Core</td>
        <td>Sustains 50,000+ incoming CAN frames/sec; end-to-end network latency &lt; 45 ms.</td>
      </tr>
      <tr>
        <td><strong>Machine Learning Inference</strong></td>
        <td>74 Production Models: XGBoost, Scikit-Learn, PyTorch (1D-CNN + BiLSTM), NumPy, SciPy</td>
        <td>Average inference latency &lt; 1.8 ms per model; batch prediction &lt; 12 ms across all 74 models.</td>
      </tr>
      <tr>
        <td><strong>Executive & Engineering Cockpit</strong></td>
        <td>Next.js 14 (React 18) + TypeScript + TailwindCSS + Three.js / React Three Fiber + Lucide</td>
        <td>Zero layout shift; 60 FPS 3D CAD rendering; responsive on mobile depot tablets and 4K command centers.</td>
      </tr>
    </tbody>
  </table>

  <h2>7.4 Edge Telematics Hardware Bill of Materials (BOM) & Firmware Architecture</h2>
  <p>
    The on-vehicle telematics node is deployed in an IP67-rated enclosure secured under the passenger seat of each commercial electric van:
  </p>

  <table>
    <thead>
      <tr>
        <th>Hardware Subsystem</th>
        <th>Component Part Number</th>
        <th>Functional Specification</th>
        <th>Unit Cost (USD)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Microcontroller (MCU)</strong></td>
        <td>Espressif ESP32-WROOM-32D</td>
        <td>Dual-Core Xtensa LX6 @ 240 MHz, 520 KB SRAM, 4 MB Flash, FreeRTOS RTOS</td>
        <td>$3.85</td>
      </tr>
      <tr>
        <td><strong>CAN Controller & PHY</strong></td>
        <td>Microchip MCP2515 + NXP TJA1050</td>
        <td>High-Speed CAN 2.0B Controller with SPI Interface, 120Ω termination, optical isolation</td>
        <td>$2.40</td>
      </tr>
      <tr>
        <td><strong>Cellular IoT & GNSS</strong></td>
        <td>Quectel EC200U-CN LTE Cat-1</td>
        <td>4G LTE Cat-1 (10 Mbps DL / 5 Mbps UL) with integrated multi-constellation GNSS GPS receiver</td>
        <td>$12.50</td>
      </tr>
      <tr>
        <td><strong>Power Management</strong></td>
        <td>Texas Instruments LM5164 Buck</td>
        <td>Wide-input DC-DC step-down converter (36V to 95V input, regulated 5.0V / 2.0A output)</td>
        <td>$1.95</td>
      </tr>
      <tr>
        <td><strong>Vehicle Interconnect</strong></td>
        <td>Amphenol OBD-II / J1939 Harness</td>
        <td>Automotive-grade twisted shielded pair cabling (CAN_H on Pin 6, CAN_L on Pin 14)</td>
        <td>$4.20</td>
      </tr>
      <tr>
        <td><strong>Protection Enclosure</strong></td>
        <td>Bud Industries IP67 Die-Cast</td>
        <td>Waterproof, dustproof, and vibration-damped aluminum chassis with thermal heat pad</td>
        <td>$6.80</td>
      </tr>
      <tr>
        <td><strong>TOTAL BOM COST</strong></td>
        <td><strong>Complete Edge Hardware Node</strong></td>
        <td><strong>Full sub-second commercial automotive telematics gateway</strong></td>
        <td><strong>$31.70 / vehicle</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="calc-box">
====================================================================================================
EDGELINK FIRMWARE DUAL-CORE RTOS EXECUTION PIPELINE (ESP32)
• Core 0 (Hard Real-Time Task): Interrupt-driven CAN RX at 100 ms (Priority 5, Highest)
  - ISR extracts 8-byte CAN payload from MCP2515 over SPI @ 10 MHz
  - Ring buffer of 256 frames protects against burst loss during high bus utilization
  - Executes Data Sentinel physical range checks in sub-25 microseconds
• Core 1 (Network & Telemetry Uplink Task): Asynchronous TLS Client (Priority 2)
  - Batches 10 validated frames into a compressed JSON telematics payload
  - Transmits over secure WebSocket (WSS) via Quectel 4G modem to FastAPI backend
  - Local SPIFFS Flash logging buffers up to 72 hours of telemetry during cellular dead zones
====================================================================================================
  </div>
</div>
"""
