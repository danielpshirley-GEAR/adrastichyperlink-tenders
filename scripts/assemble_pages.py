import os
import shutil

def assemble():
    out_dir = "out"
    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)

    # 1. Copy _next/static
    static_src = ".next/static"
    static_dest = os.path.join(out_dir, "_next", "static")
    os.makedirs(os.path.dirname(static_dest), exist_ok=True)
    shutil.copytree(static_src, static_dest)

    server_app = ".next/server/app"

    # Helper to write both path.html and path/index.html
    def deploy_html(src_file, route_path):
        dest_html = os.path.join(out_dir, route_path + ".html")
        dest_index_dir = os.path.join(out_dir, route_path)
        dest_index = os.path.join(dest_index_dir, "index.html")

        os.makedirs(os.path.dirname(dest_html), exist_ok=True)
        os.makedirs(dest_index_dir, exist_ok=True)

        shutil.copyfile(src_file, dest_html)
        shutil.copyfile(src_file, dest_index)

    # Root index
    shutil.copyfile(os.path.join(server_app, "index.html"), os.path.join(out_dir, "index.html"))

    # Root routes
    deploy_html(os.path.join(server_app, "today.html"), "today")
    deploy_html(os.path.join(server_app, "tenders.html"), "tenders")
    deploy_html(os.path.join(server_app, "applications.html"), "applications")
    deploy_html(os.path.join(server_app, "scan.html"), "scan")
    deploy_html(os.path.join(server_app, "knowledge.html"), "knowledge")
    deploy_html(os.path.join(server_app, "settings.html"), "settings")

    # Review routes
    deploy_html(os.path.join(server_app, "review.html"), "review")
    deploy_html(os.path.join(server_app, "review", "today.html"), "review/today")
    deploy_html(os.path.join(server_app, "review", "tenders.html"), "review/tenders")
    deploy_html(os.path.join(server_app, "review", "applications.html"), "review/applications")
    deploy_html(os.path.join(server_app, "review", "scan.html"), "review/scan")
    deploy_html(os.path.join(server_app, "review", "knowledge.html"), "review/knowledge")
    deploy_html(os.path.join(server_app, "review", "settings.html"), "review/settings")
    deploy_html(os.path.join(server_app, "review", "content.html"), "review/content")

    # Detail review pages
    deploy_html(os.path.join(server_app, "review", "tenders", "tender-dfe-creative-2026.html"), "review/tenders/tender-dfe-creative-2026")
    deploy_html(os.path.join(server_app, "review", "tenders", "tender-ace-branding-2026.html"), "review/tenders/tender-ace-branding-2026")
    deploy_html(os.path.join(server_app, "review", "tenders", "tender-nhs-motion-2026.html"), "review/tenders/tender-nhs-motion-2026")
    deploy_html(os.path.join(server_app, "review", "applications", "app-dfe-01.html"), "review/applications/app-dfe-01")

    # Manifest json
    manifest_src = os.path.join(server_app, "review", "manifest.json.body")
    manifest_dest = os.path.join(out_dir, "review", "manifest.json")
    os.makedirs(os.path.dirname(manifest_dest), exist_ok=True)
    shutil.copyfile(manifest_src, manifest_dest)

    # Headers for Cloudflare Pages
    headers_content = """/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: *
  X-Robots-Tag: index, follow, all
  Cache-Control: public, max-age=0, must-revalidate

/review/manifest.json
  Content-Type: application/json
"""
    with open(os.path.join(out_dir, "_headers"), "w") as f:
        f.write(headers_content)

    print("Assembly complete! out/ ready.")

if __name__ == "__main__":
    assemble()
