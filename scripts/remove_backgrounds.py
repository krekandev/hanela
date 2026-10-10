import os
import sys
from PIL import Image
from rembg import remove, new_session

def process_item(session, src_path, dst_path):
    print(f"Starting {src_path}...")
    if not os.path.exists(src_path):
        print(f"Error: {src_path} does not exist!")
        return False
    
    img = Image.open(src_path)
    # Convert if needed
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
        ("public/images/products/mix-zakuskov-24-ks.jpg", "public/images/products/featured-mix-nobg.png"),
        ("public/images/products/malinova-torta-12-16-porcii.jpg", "public/images/products/featured-malinova-nobg.png"),
        ("public/images/products/pistaciovy-cheesecake-12-16-porcii.jpg", "public/images/products/featured-pistaciovy-nobg.png"),
        ("public/images/products/karamelovy-veternik-100g.jpg", "public/images/products/featured-veternik-nobg.png")
    ]
    
    for src, dst in items:
        process_item(session, src, dst)
        
    print("All images processed successfully!")

if __name__ == "__main__":
    main()
