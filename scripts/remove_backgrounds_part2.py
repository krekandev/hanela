import os
import sys
from PIL import Image
from rembg import remove, new_session

def process_item(session, src_path, dst_path):
    print(f"Starting {src_path} -> {dst_path}...")
    if not os.path.exists(src_path):
        print(f"Error: {src_path} does not exist!")
        return False
    
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
        
    print(f"Successfully created: {dst_path}")
    return True

def main():
    print("Initializing rembg session...")
    session = new_session()
    
    items = [
        ("public/images/products/doboska.jpg", "public/images/products/doboska-nobg.png"),
        ("public/images/products/kakaova-rolada.jpg", "public/images/products/kakaova-rolada-nobg.png"),
        ("public/images/products/gastanovy-cheesecake.jpg", "public/images/products/gastanovy-cheesecake-nobg.png"),
        ("public/images/products/brownies.jpg", "public/images/products/brownies-nobg.png"),
        ("public/images/products/samrolky.jpg", "public/images/products/samrolky-nobg.png"),
        ("public/images/products/eclair.jpg", "public/images/products/eclair-nobg.png"),
        ("public/images/products/craquelin.jpg", "public/images/products/craquelin-nobg.png"),
        ("public/images/products/opity-izidor.jpg", "public/images/products/opity-izidor-nobg.png"),
        ("public/images/products/medovy-kremes.jpg", "public/images/products/medovy-kremes-nobg.png"),
        ("public/images/products/panacotta.jpg", "public/images/products/panacotta-nobg.png"),
    ]
    
    for src, dst in items:
        process_item(session, src, dst)
        
    print("All 10 remaining zakusky items processed successfully!")

if __name__ == "__main__":
    main()
