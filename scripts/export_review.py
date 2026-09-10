# scripts/export_review.py
import os
import shutil
import re
import datetime

def export_review():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    export_dir = os.path.join(root_dir, "review-export")
    server_app = os.path.join(root_dir, ".next", "server", "app")
    server_review = os.path.join(server_app, "review")
    static_src = os.path.join(root_dir, ".next", "static")

    os.makedirs(export_dir, exist_ok=True)
    screenshots_dir = os.path.join(export_dir, "screenshots")
    os.makedirs(screenshots_dir, exist_ok=True)

    # 1. Copy static assets
    static_dest = os.path.join(export_dir, "_next", "static")
    if os.path.exists(static_dest):
        shutil.rmtree(static_dest)
    os.makedirs(os.path.dirname(static_dest), exist_ok=True)
    if os.path.exists(static_src):
        shutil.copytree(static_src, static_dest)

    # 2. File mapping
    file_map = {
        os.path.join(server_app, "review.html"): "index.html",
        os.path.join(server_review, "today.html"): "today.html",
        os.path.join(server_review, "tenders.html"): "tenders.html",
        os.path.join(server_review, "tenders", "tender-dfe-creative-2026.html"): "tender-detail.html",
        os.path.join(server_review, "applications.html"): "applications.html",
        os.path.join(server_review, "applications", "app-dfe-01.html"): "application-detail.html",
        os.path.join(server_review, "scan.html"): "scan.html",
        os.path.join(server_review, "knowledge.html"): "knowledge.html",
        os.path.join(server_review, "settings.html"): "settings.html",
        os.path.join(server_review, "content.html"): "content.html",
    }

    # URL replacement map for relative GitHub Pages navigation
    replacements = [
        ('href="/_next/', 'href="./_next/'),
        ('src="/_next/', 'src="./_next/'),
        ('href="/review/today"', 'href="today.html"'),
        ('href="/review/tenders"', 'href="tenders.html"'),
        ('href="/review/tenders/tender-dfe-creative-2026"', 'href="tender-detail.html"'),
        ('href="/review/tenders/tender-ace-branding-2026"', 'href="tenders.html"'),
        ('href="/review/tenders/tender-nhs-motion-2026"', 'href="tenders.html"'),
        ('href="/review/applications"', 'href="applications.html"'),
        ('href="/review/applications/app-dfe-01"', 'href="application-detail.html"'),
        ('href="/review/scan"', 'href="scan.html"'),
        ('href="/review/knowledge"', 'href="knowledge.html"'),
        ('href="/review/settings"', 'href="settings.html"'),
        ('href="/review/content"', 'href="content.html"'),
        ('href="/review/manifest.json"', 'href="manifest.json"'),
    ]

    for src, dest_name in file_map.items():
        if os.path.exists(src):
            with open(src, "r", encoding="utf-8") as f:
                content = f.read()

            for old, new in replacements:
                content = content.replace(old, new)

            dest_path = os.path.join(export_dir, dest_name)
            with open(dest_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Exported: {dest_name} ({len(content)} bytes)")
        else:
            print(f"Warning: {src} does not exist.")

    # 3. Create manifest.json
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    manifest_content = f"""{{
  "environment": "public-review",
  "buildId": "rev-2026.09.10-v1",
  "deployedAt": "{now_iso}",
  "routes": [
    "index.html",
    "today.html",
    "tenders.html",
    "tender-detail.html",
    "applications.html",
    "application-detail.html",
    "scan.html",
    "knowledge.html",
    "settings.html",
    "content.html",
    "manifest.json"
  ],
  "screenshots": [
    "screenshots/today.png",
    "screenshots/tenders.png",
    "screenshots/tender-detail.png",
    "screenshots/applications.png",
    "screenshots/application-detail.png",
    "screenshots/scan.png",
    "screenshots/knowledge.png"
  ]
}}"""
    manifest_path = os.path.join(export_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write(manifest_content)
    print("Exported: manifest.json")

    # 4. Copy to out/review-export for Cloudflare Pages dual-hosting
    out_review_export = os.path.join(root_dir, "out", "review-export")
    if os.path.exists(out_review_export):
        shutil.rmtree(out_review_export)
    shutil.copytree(export_dir, out_review_export)
    print("Synchronized to out/review-export for Cloudflare hosting.")

if __name__ == "__main__":
    export_review()
