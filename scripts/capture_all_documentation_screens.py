import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity-ide\brain\d91338ad-71c1-4c40-b4d1-a3d9876fbe72"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://localhost:3000/dashboard"

def capture_all():
    print("--- Starting Automated Screen Capture for 7 Pages (Before & After) ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--disable-gpu", "--no-sandbox"]
        )
        context = browser.new_context(viewport={"width": 1600, "height": 1050})
        page = context.new_page()

        def dismiss_modal():
            try:
                page.wait_for_timeout(300)
                # Look for "Understood", "Dismiss", or modal close buttons
                btn = page.locator('button:has-text("Understood"), button:has-text("Close"), button[aria-label="Close"]').first
                if btn.is_visible(timeout=1000):
                    btn.click()
                    page.wait_for_timeout(300)
            except Exception:
                pass

        # ─────────────────────────────────────────────────────────────
        # 1. FLEET OPERATIONS COMMAND
        # ─────────────────────────────────────────────────────────────
        print("Capturing Page 1: Operations Command...")
        page.goto(BASE_URL, wait_until="networkidle")
        dismiss_modal()
        page.wait_for_timeout(1000)

        # Make sure in Operations view
        ops_btn = page.locator('button:has-text("Operations View")').first
        if ops_btn.is_visible():
            ops_btn.click()
            page.wait_for_timeout(1000)
            dismiss_modal()

        # Before: Default Nominal Approved Dispatch
        p1_before = os.path.join(ARTIFACT_DIR, "doc_01_operations_before.png")
        page.screenshot(path=p1_before, full_page=False)
        print(f"Saved: {p1_before}")

        # After: Filter by Critical Hold / Warning
        try:
            crit_btn = page.locator('button:has-text("Immediate Attention"), button:has-text("Critical Hold")').first
            if crit_btn.is_visible():
                crit_btn.click()
                page.wait_for_timeout(1200)
        except Exception as e:
            print("P1 filter click error:", e)

        p1_after = os.path.join(ARTIFACT_DIR, "doc_01_operations_after.png")
        page.screenshot(path=p1_after, full_page=False)
        print(f"Saved: {p1_after}")

        # Reset filter to All
        try:
            all_btn = page.locator('button:has-text("Total Monitored Fleet")').first
            if all_btn.is_visible():
                all_btn.click()
                page.wait_for_timeout(500)
        except Exception:
            pass

        # ─────────────────────────────────────────────────────────────
        # 2. FLEET HEALTH OVERVIEW (Engineering View)
        # ─────────────────────────────────────────────────────────────
        print("Capturing Page 2: Fleet Health Overview...")
        eng_btn = page.locator('button:has-text("Engineering View")').first
        if eng_btn.is_visible():
            eng_btn.click()
            page.wait_for_timeout(1000)
            dismiss_modal()

        fleet_tab = page.locator('button:has-text("Fleet Health Overview")').first
        if fleet_tab.is_visible():
            fleet_tab.click()
            page.wait_for_timeout(1200)
            dismiss_modal()

        page.wait_for_timeout(1500) # allow 3D canvas to render
        p2_before = os.path.join(ARTIFACT_DIR, "doc_02_fleet_overview_before.png")
        page.screenshot(path=p2_before, full_page=False)
        print(f"Saved: {p2_before}")

        # After: Top Filter change (Manufacturer = Tata Motors, State = Karnataka)
        try:
            # Change manufacturer dropdown in top filter
            m_select = page.locator('select[title="Filter by Vehicle Manufacturer"]').first
            if m_select.is_visible():
                m_select.select_option("tata")
                page.wait_for_timeout(1000)
            # Change state dropdown
            s_select = page.locator('select[title="Filter by State / RTO Region"]').first
            if s_select.is_visible():
                s_select.select_option("KA")
                page.wait_for_timeout(1200)
        except Exception as e:
            print("P2 filter error:", e)

        p2_after = os.path.join(ARTIFACT_DIR, "doc_02_fleet_overview_after.png")
        page.screenshot(path=p2_after, full_page=False)
        print(f"Saved: {p2_after}")

        # Reset filters
        try:
            m_select = page.locator('select[title="Filter by Vehicle Manufacturer"]').first
            if m_select.is_visible(): m_select.select_option("all")
            s_select = page.locator('select[title="Filter by State / RTO Region"]').first
            if s_select.is_visible(): s_select.select_option("all")
            page.wait_for_timeout(500)
        except Exception:
            pass

        # ─────────────────────────────────────────────────────────────
        # 3. STATE ESTIMATION HUB (Module A)
        # ─────────────────────────────────────────────────────────────
        print("Capturing Page 3: State Estimation Hub...")
        state_tab = page.locator('button:has-text("State Estimation Hub")').first
        if state_tab.is_visible():
            state_tab.click()
            page.wait_for_timeout(1200)
            dismiss_modal()

        page.wait_for_timeout(1000)
        p3_before = os.path.join(ARTIFACT_DIR, "doc_03_state_estimation_before.png")
        page.screenshot(path=p3_before, full_page=False)
        print(f"Saved: {p3_before}")

        # After: Adjust sliders & change engine
        try:
            # Look for sliders or engine selector
            page.evaluate("""() => {
                const inputs = Array.from(document.querySelectorAll('input[type="range"]'));
                if (inputs.length > 0) {
                    inputs[0].value = (parseFloat(inputs[0].min) + parseFloat(inputs[0].max)) / 2;
                    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                }
                const selects = Array.from(document.querySelectorAll('select'));
                selects.forEach(s => {
                    const opt = Array.from(s.options).find(o => o.value.toLowerCase().includes('random') || o.value.toLowerCase().includes('tree'));
                    if (opt) {
                        s.value = opt.value;
                        s.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }""")
            page.wait_for_timeout(1500)
        except Exception as e:
            print("P3 simulation error:", e)

        p3_after = os.path.join(ARTIFACT_DIR, "doc_03_state_estimation_after.png")
        page.screenshot(path=p3_after, full_page=False)
        print(f"Saved: {p3_after}")

        # ─────────────────────────────────────────────────────────────
        # 4. THERMAL SAFETY & DIGITAL TWIN (Module B)
        # ─────────────────────────────────────────────────────────────
        print("Capturing Page 4: Thermal Safety...")
        thermal_tab = page.locator('button:has-text("Thermal Safety")').first
        if thermal_tab.is_visible():
            thermal_tab.click()
            page.wait_for_timeout(1200)
            dismiss_modal()

        page.wait_for_timeout(1000)
        p4_before = os.path.join(ARTIFACT_DIR, "doc_04_thermal_safety_before.png")
        page.screenshot(path=p4_before, full_page=False)
        print(f"Saved: {p4_before}")

        # After: Heat Injection Simulation (Set Pack Temp to 53°C)
        try:
            page.evaluate("""() => {
                const inputs = Array.from(document.querySelectorAll('input[type="range"]'));
                inputs.forEach(input => {
                    input.value = "53.5";
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            }""")
            page.wait_for_timeout(500)
            diag_btn = page.locator('button:has-text("Run Thermal Diagnostics")').first
            if diag_btn.is_visible():
                diag_btn.click()
            page.wait_for_timeout(1500)
        except Exception as e:
            print("P4 thermal simulation error:", e)

        p4_after = os.path.join(ARTIFACT_DIR, "doc_04_thermal_safety_after.png")
        page.screenshot(path=p4_after, full_page=False)
        print(f"Saved: {p4_after}")

        # ─────────────────────────────────────────────────────────────
        # 5. DRIVER PROFILING & BEHAVIOR AI (Module C)
        # ─────────────────────────────────────────────────────────────
        print("Capturing Page 5: Driver Profiling...")
        driver_tab = page.locator('button:has-text("Driver Profiling")').first
        if driver_tab.is_visible():
            driver_tab.click()
            page.wait_for_timeout(1200)
            dismiss_modal()

        page.wait_for_timeout(1000)
        p5_before = os.path.join(ARTIFACT_DIR, "doc_05_driver_profiling_before.png")
        page.screenshot(path=p5_before, full_page=False)
        print(f"Saved: {p5_before}")

        # After: Aggressive Driving Behavior Simulation
        try:
            page.evaluate("""() => {
                const inputs = Array.from(document.querySelectorAll('input[type="range"]'));
                inputs.forEach((input, idx) => {
                    const maxVal = parseFloat(input.max) || 10;
                    input.value = (maxVal * 0.85).toString();
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            }""")
            page.wait_for_timeout(1500)
        except Exception as e:
            print("P5 driver simulation error:", e)

        p5_after = os.path.join(ARTIFACT_DIR, "doc_05_driver_profiling_after.png")
        page.screenshot(path=p5_after, full_page=False)
        print(f"Saved: {p5_after}")

        # ─────────────────────────────────────────────────────────────
        # 6. KNEE PROGNOSTICS (Module C)
        # ─────────────────────────────────────────────────────────────
        print("Capturing Page 6: Knee Prognostics...")
        knee_tab = page.locator('button:has-text("Knee Prognostics")').first
        if knee_tab.is_visible():
            knee_tab.click()
            page.wait_for_timeout(1200)
            dismiss_modal()

        page.wait_for_timeout(1000)
        p6_before = os.path.join(ARTIFACT_DIR, "doc_06_knee_prognostics_before.png")
        page.screenshot(path=p6_before, full_page=False)
        print(f"Saved: {p6_before}")

        # After: Aging Trajectory Rollover Simulation (High Cycles, Low SOH)
        try:
            page.evaluate("""() => {
                const inputs = Array.from(document.querySelectorAll('input[type="range"]'));
                if (inputs.length >= 2) {
                    inputs[0].value = "850"; // cycles
                    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    inputs[0].dispatchEvent(new Event('change', { bubbles: true }));

                    inputs[1].value = "77"; // SOH
                    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
                    inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
                }
            }""")
            page.wait_for_timeout(1500)
        except Exception as e:
            print("P6 knee simulation error:", e)

        p6_after = os.path.join(ARTIFACT_DIR, "doc_06_knee_prognostics_after.png")
        page.screenshot(path=p6_after, full_page=False)
        print(f"Saved: {p6_after}")

        # ─────────────────────────────────────────────────────────────
        # 7. META-ENSEMBLE REPORT
        # ─────────────────────────────────────────────────────────────
        print("Capturing Page 7: Meta-Ensemble Report...")
        meta_tab = page.locator('button:has-text("Meta-Ensemble Report")').first
        if meta_tab.is_visible():
            meta_tab.click()
            page.wait_for_timeout(1500)
            dismiss_modal()

        page.wait_for_timeout(1200)
        p7_before = os.path.join(ARTIFACT_DIR, "doc_07_meta_ensemble_before.png")
        page.screenshot(path=p7_before, full_page=False)
        print(f"Saved: {p7_before}")

        # After: Official Print Certificate Mode (A4 Print Preview rendering)
        page.emulate_media(media="print")
        page.wait_for_timeout(1000)
        p7_after = os.path.join(ARTIFACT_DIR, "doc_07_meta_ensemble_after.png")
        page.screenshot(path=p7_after, full_page=False)
        print(f"Saved: {p7_after}")
        page.emulate_media(media=None)

        browser.close()
        print("--- All 14 screenshots successfully captured and stored in artifact directory! ---")

if __name__ == "__main__":
    capture_all()
