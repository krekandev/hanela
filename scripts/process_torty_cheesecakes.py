import os
import sys
from PIL import Image
from rembg import remove, new_session

ITEMS = [
    ("public/images/products/mangovy-cheesecake-12-16-porcii.jpg", "public/images/products/mangovy-cheesecake-12-16-porcii-nobg.png"),
    ("public/images/products/pistaciovy-cheesecake-12-16-porcii.jpg", "public/images/products/pistaciovy-cheesecake-12-16-porcii-nobg.png"),
    ("public/images/products/malinova-torta-12-16-porcii.jpg", "public/images/products/malinova-torta-12-16-porcii-nobg.png"),
    ("public/images/products/red-velvet-torta.jpg", "public/images/products/red-velvet-torta-nobg.png"),
    ("public/images/products/karamelovy-vencek.jpg", "public/images/products/karamelovy-vencek-nobg.png"),
    ("public/images/products/citronovy-cheesecake-12-16-porcii.jpg", "public/images/products/citronovy-cheesecake-12-16-porcii-nobg.png"),
    ("public/images/products/cheesecake-gastan.jpg", "public/images/products/cheesecake-gastan-nobg.png"),
    ("public/images/products/cokoladova-torta-12-16-porcii.jpg", "public/images/products/cokoladova-torta-12-16-porcii-nobg.png"),
    ("public/images/products/puncova-torta-12-16-porcii.jpg", "public/images/products/puncova-torta-12-16-porcii-nobg.png"),
    ("public/images/products/gastanova-torta.jpg", "public/images/products/gastanova-torta-nobg.png"),
    ("public/images/products/medovy-kremes.jpg", "public/images/products/medovy-kremes-nobg.png"),
    ("public/images/products/makova-torta-bezlepkova.jpg", "public/images/products/makova-torta-bezlepkova-nobg.png"),
    ("public/images/products/orechova-torta.jpg", "public/images/products/orechova-torta-nobg.png"),
    ("public/images/products/pavlove-torta.jpg", "public/images/products/pavlove-torta-nobg.png"),
]

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
    
    success_count = 0
    for src, dst in ITEMS:
        if process_item(session, src, dst):
            success_count += 1
        
    print(f"\nProcessing complete: {success_count}/{len(ITEMS)} images processed successfully.")

if __name__ == "__main__":
    main()
