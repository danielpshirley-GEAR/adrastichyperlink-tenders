# scripts/capture_screenshots.py
import subprocess
import time
import os
import glob

def capture_all():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    output_dir = os.path.join(root_dir, "review-export", "screenshots")
    user_data_dir = os.path.join(root_dir, ".chrome-review-tmp")

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(user_data_dir, exist_ok=True)

    targets = [
        ("today.png", "http://localhost:3001/review/today"),
        ("tenders.png", "http://localhost:3001/review/tenders"),
        ("tender-detail.png", "http://localhost:3001/review/tenders/tender-dfe-creative-2026"),
        ("applications.png", "http://localhost:3001/review/applications"),
        ("application-detail.png", "http://localhost:3001/review/applications/app-dfe-01"),
        ("scan.png", "http://localhost:3001/review/scan"),
        ("knowledge.png", "http://localhost:3001/review/knowledge"),
    ]

    def cleanup_singleton():
        for f in glob.glob(os.path.join(user_data_dir, "Singleton*")):
            try:
                os.remove(f)
            except Exception:
                pass

    success = True
    for filename, url in targets:
        dest = os.path.join(output_dir, filename)
        if os.path.exists(dest):
            os.remove(dest)
        cleanup_singleton()
        print(f"Capturing {filename} from {url}...")
        cmd = [
            chrome_path,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-extensions",
            "--disable-background-networking",
            "--disable-sync",
            "--window-size=1440,1080",
            f"--user-data-dir={user_data_dir}",
            f"--screenshot={dest}",
            url
        ]
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        start_t = time.time()
        captured = False
        while time.time() - start_t < 15:
            if os.path.exists(dest) and os.path.getsize(dest) > 10000:
                captured = True
                break
            time.sleep(0.5)

        proc.terminate()
        try:
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            proc.kill()
        cleanup_singleton()

        if captured:
            print(f"-> SUCCESS: {filename} ({os.path.getsize(dest)} bytes)")
        else:
            print(f"-> FAILED: {filename}")
            success = False
        time.sleep(0.5)

    print("Screenshots complete. Status:", "ALL_OK" if success else "FAILED")
    return success

if __name__ == "__main__":
    capture_all()
