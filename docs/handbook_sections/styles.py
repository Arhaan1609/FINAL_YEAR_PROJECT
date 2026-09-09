# -*- coding: utf-8 -*-
"""
Styling and Cover Page for Master Handbook
"""

CSS_STYLES = """
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  @page {
    size: A4;
    margin: 14mm 13mm 14mm 13mm;
    @bottom-right {
      content: "Page " counter(page);
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      color: #64748b;
    }
  }

  * { box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 9.5pt;
    line-height: 1.6;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  .cover-page {
    page-break-after: always;
    min-height: 90vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-bottom: 3px solid #0891b2;
    padding: 24px 10px 20px 10px;
  }

  .cover-badge {
    display: inline-block;
    background-color: #ecfeff;
    color: #0891b2;
    border: 1px solid #a5f3fc;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .cover-title {
    font-size: 25pt;
    font-weight: 900;
    color: #0f172a;
    line-height: 1.15;
    letter-spacing: -0.03em;
    margin: 18px 0 10px 0;
  }

  .cover-subtitle {
    font-size: 11.5pt;
    color: #475569;
    font-weight: 500;
    line-height: 1.5;
    max-width: 800px;
  }

  .cover-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 18px;
    margin: 20px 0;
  }

  .cover-meta-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .cover-meta-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5pt;
    font-weight: 700;
    color: #0f172a;
    margin-top: 2px;
  }

  .chapter {
    page-break-before: always;
    margin-bottom: 28px;
  }

  h1 {
    font-size: 18pt;
    font-weight: 900;
    color: #0f172a;
    border-bottom: 2.5px solid #0891b2;
    padding-bottom: 6px;
    margin-top: 22px;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
    page-break-after: avoid;
  }

  h2 {
    font-size: 13pt;
    font-weight: 800;
    color: #1e293b;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin-top: 18px;
    margin-bottom: 10px;
    letter-spacing: -0.01em;
    page-break-after: avoid;
  }

  h3 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #0e7490;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  p {
    margin: 7px 0;
    line-height: 1.6;
    text-align: justify;
  }

  ul, ol {
    margin: 6px 0 10px 20px;
    padding-left: 0;
  }

  li {
    margin-bottom: 4px;
    line-height: 1.55;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 12px 0;
    page-break-inside: avoid;
  }

  .card-highlight {
    border-left: 4px solid #0891b2;
    background: #f0fdfa;
  }

  .card-warning {
    border-left: 4px solid #f59e0b;
    background: #fffbeb;
  }

  .card-danger {
    border-left: 4px solid #ef4444;
    background: #fef2f2;
  }

  .formula-box {
    background: #0f172a;
    color: #f8fafc;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 12px 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
    page-break-inside: avoid;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .formula-box .title {
    color: #94a3b8;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
    border-bottom: 1px solid #334155;
    padding-bottom: 3px;
  }

  .formula-box code {
    color: #38bdf8;
    font-size: 9.5pt;
    font-weight: 700;
    display: block;
    margin: 4px 0;
  }

  .formula-box .desc {
    color: #cbd5e1;
    font-size: 8pt;
    margin-top: 5px;
    line-height: 1.4;
    font-family: 'Inter', sans-serif;
  }

  .calc-box {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    color: #0f172a;
    white-space: pre-wrap;
    margin: 10px 0;
    page-break-inside: avoid;
    line-height: 1.45;
  }

  .side-by-side {
    display: flex;
    flex-direction: row;
    gap: 12px;
    margin: 14px 0;
    page-break-inside: avoid;
  }

  .side-by-side .img-card {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }

  .side-by-side .img-card img {
    width: 100%;
    height: auto;
    display: block;
  }

  .side-by-side .img-card .caption {
    padding: 6px 8px;
    font-size: 7.5pt;
    font-weight: 600;
    color: #475569;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    text-align: center;
  }

  .img-full {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
    margin: 14px 0;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }

  .img-full img {
    width: 100%;
    height: auto;
    display: block;
  }

  .img-full .caption {
    padding: 7px 12px;
    font-size: 8pt;
    font-weight: 600;
    color: #475569;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    text-align: center;
  }

  .badge-pill {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: 'JetBrains Mono', monospace;
  }

  .badge-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .badge-red { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }

  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 6px 10px;
    border: 1px solid #1e293b;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  td {
    padding: 5px 9px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
    line-height: 1.45;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .viva-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #0891b2;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 12px 0;
    page-break-inside: avoid;
  }

  .viva-q {
    font-weight: 800;
    color: #0e7490;
    font-size: 9pt;
    margin-bottom: 5px;
  }

  .viva-a {
    color: #334155;
    font-size: 8.5pt;
    line-height: 1.55;
  }

  .toc-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 18px 22px;
    margin: 20px 0;
  }

  .toc-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px dotted #cbd5e1;
    font-size: 8.5pt;
  }

  .toc-title { font-weight: 600; color: #0f172a; }
  .toc-ch { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #0891b2; margin-right: 8px; }
</style>
"""

def render_cover():
    return """
<div class="cover-page">
  <div>
    <span class="cover-badge">ACADEMIC & INDUSTRIAL MASTER HANDBOOK • FINAL YEAR THESIS REPORT</span>
    <div class="cover-title">
      Commercial EV Battery Intelligence Platform
    </div>
    <div class="cover-subtitle">
      Multi-Zone Cyber-Physical Telematics, Tri-Pillar Machine Learning Ensembles (74 Models), 3D Digital Twin, and Autonomous Degradation Prognostics across 778 Commercial Electric Vehicles
    </div>

    <div class="cover-meta-grid">
      <div>
        <div class="cover-meta-label">Project Classification</div>
        <div class="cover-meta-val">Cyber-Physical Systems (CPS)</div>
      </div>
      <div>
        <div class="cover-meta-label">Dataset Provenance</div>
        <div class="cover-meta-val">778 Commercial EVs (53M+ Pts)</div>
      </div>
      <div>
        <div class="cover-meta-label">Machine Learning Zoo</div>
        <div class="cover-meta-val">74 Heterogeneous Models</div>
      </div>
      <div>
        <div class="cover-meta-label">Target Audience</div>
        <div class="cover-meta-val">University Faculty & Executives</div>
      </div>
      <div>
        <div class="cover-meta-label">Production Status</div>
        <div class="cover-meta-val">Live Deployed (Ports 3000 & 8000)</div>
      </div>
      <div>
        <div class="cover-meta-label">Core Battery Chemistry</div>
        <div class="cover-meta-val">12.4–14.2 kWh LiFePO4 (LFP)</div>
      </div>
    </div>

    <div class="card card-highlight">
      <h3 style="margin-top:0; color:#0e7490;">Document Mission & Executive Intent</h3>
      <p style="margin-bottom:0;">
        This technical master handbook provides an exhaustive, mathematically rigorous, and operationally accessible blueprint of the EV Battery Intelligence Platform. It details the complete end-to-end journey: from 100 ms CAN bus edge telemetry ingestion across 778 commercial delivery trucks, through 19-Fold Leave-One-Group-Out zero-leakage cross-validation, to real-world before-and-after simulation case studies on vehicle <code>DL1LAK7203</code>, culminating in an authoritative faculty evaluation defense guide.
      </p>
    </div>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #cbd5e1; padding-top:12px; font-family:'JetBrains Mono', monospace; font-size:8pt; color:#64748b;">
    <div>CONFIDENTIAL & PROPRIETARY • DEPLOYED REPOSITORY BUILD</div>
    <div>DELHI NCR • MUMBAI • AHMEDABAD • BENGALURU</div>
  </div>
</div>
"""

def render_toc():
    return """
<div class="chapter">
  <h1>Table of Contents</h1>
  <div class="toc-container">
    <div class="toc-item"><span class="toc-title"><span class="toc-ch">CH 1</span>Executive Abstract, Problem Statement & Fundamental Concepts</span><span>03</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>1.1 Industrial Context & The 3 Catastrophic BMS Bottlenecks</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>1.2 Conventional BMS vs. Cyber-Physical Platform Matrix</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>1.3 Crucial Distinction: Fuel Level (SOC) vs. Lifespan Health (SOH)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>1.4 The "100% SOC with 85% SOH" Phenomenon & Container Shrinkage</span></div>
    
    <div class="toc-item"><span class="toc-title"><span class="toc-ch">CH 2</span>Commercial Fleet Dataset & Zero-Leakage ML Methodology</span><span>07</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>2.1 Dataset Dimensions (778 Commercial LCVs, 53M+ Points)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>2.2 The 28-Feature Engineered Electrochemical Vector</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>2.3 The Academic Data Leakage Epidemic (Vehicle Memorization)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>2.4 19-Fold Leave-One-Group-Out Cross-Validation (LOGO-CV) Proof</span></div>
    
    <div class="toc-item"><span class="toc-title"><span class="toc-ch">CH 3</span>Tri-Pillar Cyber-Physical Architecture & 74-Model Zoo</span><span>12</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>3.1 Pillar A: Microscopic State Estimation Hub (56 Models)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>3.2 Pillar B: Thermodynamic Safety & 1D-CNN + LSTM Deep Twin</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>3.3 Pillar C: Behavioral Diagnostics & Knee Inflection Prognostics</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>3.4 Meta-Ensemble Stacking Meta-Learner & Cryptographic Seal</span></div>

    <div class="toc-item"><span class="toc-title"><span class="toc-ch">CH 4</span>Public Landing Portal Walkthrough</span><span>18</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>4.1 Hero Section & Real-World Fleet Mission</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>4.2 Interactive Live Model Sandbox & Real-Time Slider Physics</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>4.3 Enterprise Fleet ROI & Life Extension Financial Calculator</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>4.4 Fleet Health Radar & Real-Time Operational Distribution</span></div>

    <div class="toc-item"><span class="toc-title"><span class="toc-ch">CH 5</span>Page-by-Page Technical & Operational Dashboard Guide</span><span>24</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>5.1 Page 1: Fleet Operations Command (Dispatch Triage)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>5.2 Page 2: Fleet Health Overview & 3D CAD Digital Twin</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>5.3 Page 3: State Estimation Hub (Module A • 56 ML Models)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>5.4 Page 4: Thermal Safety & Multi-Zone Twin (Module B)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>5.5 Page 5: Driver Profiling & Behavior AI (Module C)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>5.6 Page 6: Knee Point Prognostics (Module C Rollover)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>5.7 Page 7: Meta-Ensemble Diagnostic Certificate & AI Copilot</span></div>

    <div class="toc-item"><span class="toc-title"><span class="toc-ch">CH 6</span>Comprehensive Commercial Vehicle Case Study: DL1LAK7203</span><span>36</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>6.1 Baseline Vehicle Profile (Euler HiLoad 12.4 kWh LFP)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>6.2 Multi-Scenario Stress Testing (Scenarios A through D)</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>6.3 Electrochemical Root-Cause Sensitivity Breakdown</span></div>

    <div class="toc-item"><span class="toc-title"><span class="toc-ch">CH 7</span>Data Sentinel Framework, 3D Digital Twin & Deployment</span><span>41</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>7.1 Anti-Mocking Architecture: Eliminating Silent Fallbacks</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>7.2 Three.js 16-Cell Prismatic Health & Thermal Shader Mechanics</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>7.3 Production Software Stack & Edge Hardware Integration</span></div>

    <div class="toc-item"><span class="toc-title"><span class="toc-ch">CH 8</span>Faculty Viva Voce Defense Guide & Master Model Zoo</span><span>46</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>8.1 Top 10 Faculty Examination Questions & Mathematical Proofs</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>8.2 Complete Benchmark Directory across 74 Production Models</span></div>
    <div class="toc-item" style="padding-left: 20px; font-size: 8pt; color: #64748b;"><span>8.3 Academic Conclusion & Evaluator Summary</span></div>
  </div>
</div>
"""
