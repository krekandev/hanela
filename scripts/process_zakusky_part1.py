import os
import sys
import time
from PIL import Image
from rembg import remove, new_session

def process_item(session, src_path, dst_path):
    print(f"Processing: {src_path} -> {dst_path}")
    if not os.path.exists(src_path):
        print(f"Error: Source file {src_path} not found!")
        return False

    t0 = time.time()
    img = Image.open(src_path)
    if img.mode != "RGB" and img.mode != "RGBA":
        img = img.convert("RGBA")

    out = remove(img, session=session)

    bbox = out.getbbox()
    if bbox:
        cropped = out.crop(bbox)
        w, h = cropped.size
        # Center in square with 6% padding for clean floating display
        side = max(w, h)
        pad = int(side * 0.06)
        canvas_dim = side + 2 * pad
        canvas = Image.new("RGBA", (canvas_dim, canvas_dim), (0, 0, 0, 0))
        paste_x = (canvas_dim - w) // 2
        paste_y = (canvas_dim - h) // 2
        canvas.paste(cropped, (paste_x, paste_y), mask=cropped.split()[3])
        canvas.save(dst_path, format="PNG", optimize=True)
    else:
        out.save(dst_path, format="PNG", optimize=True)

    dt = time.time() - t0
    size_bytes = os.path.getsize(dst_path)
    print(f"Done in {dt:.2f}s | Saved: {dst_path} ({size_bytes} bytes)")
    return True

def main():
    slugs = [
        "vanilkovy-vencek",
        "karamelovy-veternik-100g",
        "mini-pavlovka-gastanova",
        "peceny-nanuk-v-bielej-cokolade",
        "pistaciove-tartaletky",
        "profiterolky",
        "plnene-kosicky-cokoladove",
        "laskonky",
        "parizske-rozky",
        "puncovy-rez"
    ]

    print("Initializing rembg session...")
    session = new_session()

    results = []
    for slug in slugs:
        src = f"public/images/products/{slug}.jpg"
        dst = f"public/images/products/{slug}-nobg.png"
        ok = process_item(session, src, dst)
        results.append((slug, ok))

    print("\n--- Summary ---")
    all_ok = True
    for slug, ok in results:
        status = "OK" if ok else "FAILED"
        if not ok:
            all_ok = False
        print(f"[{status}] {slug}")

    if all_ok:
        print("\nAll 10 images processed successfully!")
    else:
        print("\nSome images failed to process!")
        sys.exit(1)

if __name__ == "__main__":
    main()
