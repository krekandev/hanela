import os
import json
import urllib.request
import sys
import subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_catalog import parse_files, slugify, fix_text

PRODUCTS_DIR = "/Users/filip/Desktop/weby /hanela/public/images/products"
os.makedirs(PRODUCTS_DIR, exist_ok=True)

def download_and_optimize():
    items = parse_files()
    print(f"Checking images for {len(items)} products...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    download_tasks = []
    
    for p in items:
        name = fix_text(p['name']).strip()
        slug = slugify(name)
        medias = p.get('medias', [])
        
        for idx, m in enumerate(medias):
            url = m.get('url')
            if not url:
                continue
            
            # primary filename and indexed filename
            if idx == 0:
                target_filename = f"{slug}.jpg"
            else:
                target_filename = f"{slug}-{idx + 1}.jpg"
                
            target_path = os.path.join(PRODUCTS_DIR, target_filename)
            download_tasks.append((url, target_path, target_filename, name, idx))
            
    print(f"Total images to ensure: {len(download_tasks)}")
    
    for url, target_path, filename, name, idx in download_tasks:
        if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
            print(f"[EXISTS] {filename}")
            continue
            
        print(f"[DOWNLOADING] {name} (#{idx+1}) -> {filename} from {url}")
        try:
            req = urllib.request.Request(url, headers=headers)
            temp_path = target_path + ".tmp"
            with urllib.request.urlopen(req, timeout=20) as resp, open(temp_path, "wb") as out:
                out.write(resp.read())
                
            # Optimize with macOS sips tool: max dimension 1200, jpeg quality 80
            subprocess.run([
                "sips", "-Z", "1200", "-s", "format", "jpeg", "-s", "formatOptions", "80",
                temp_path, "--out", target_path
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            size_kb = os.path.getsize(target_path) / 1024
            print(f"  -> Saved & compressed: {filename} ({size_kb:.1f} KB)")
        except Exception as e:
            print(f"  -> Error downloading {url}: {e}")

if __name__ == '__main__':
    download_and_optimize()
