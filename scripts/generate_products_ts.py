import os
import sys
import json
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_catalog import parse_files, slugify, fix_text, determine_subcategory

COMMON_KORPUS = [
    {"id": "korpus-piskot", "name": "Piškótový", "price": 0},
    {"id": "korpus-mandel", "name": "Mandľový", "price": 0},
    {"id": "korpus-kakao", "name": "Kakaový", "price": 0},
    {"id": "korpus-pistacia", "name": "Pistáciový", "price": 0},
    {"id": "korpus-coko-kúsky", "name": "Piškót s kúskami čokolády", "price": 0},
    {"id": "korpus-orech", "name": "Orechový", "price": 0},
    {"id": "korpus-mak", "name": "Makový", "price": 0},
]

COMMON_KREM = [
    {"id": "krem-mascarpone-biela-coko", "name": "Mascarpone s bielou čokoládou", "price": 0},
    {"id": "krem-cokoladovy", "name": "Čokoládový", "price": 0},
    {"id": "krem-nutelovy", "name": "Nutelový", "price": 0},
    {"id": "krem-gastanovy", "name": "Gaštanový", "price": 0},
    {"id": "krem-karamelovy", "name": "Karamelový", "price": 0},
    {"id": "krem-orieskovy", "name": "Orieškový", "price": 0},
    {"id": "krem-pistaciovy", "name": "Pistáciový", "price": 0},
    {"id": "krem-kokosovy", "name": "Kokosový", "price": 0},
]

COMMON_DOPLNKY = [
    {"id": "doplnok-slany-karamel", "name": "Slaný karamel", "price": 0},
    {"id": "doplnok-malinova-redukcia", "name": "Malinová redukcia", "price": 0},
    {"id": "doplnok-mix-ovocia", "name": "Mix ovocia redukcia", "price": 0},
    {"id": "doplnok-mangova-redukcia", "name": "Mangová redukcia", "price": 0},
    {"id": "doplnok-jahody", "name": "Čerstvé jahody", "price": 0},
    {"id": "doplnok-cucoriedky", "name": "Čučoriedky", "price": 0},
    {"id": "doplnok-marhulovy-dzem", "name": "Marhuľový džem", "price": 0},
    {"id": "doplnok-malinovy-dzem", "name": "Malinový džem", "price": 0},
    {"id": "doplnok-jahodovy-dzem", "name": "Jahodový džem", "price": 0},
    {"id": "doplnok-visne", "name": "Višne", "price": 0},
]

COMMON_DIET = [
    {"id": "diet-bezlepkova", "name": "Bezlepková úprava", "price": 5.0, "priceFormatted": "+5 €"},
    {"id": "diet-bezlaktozova", "name": "Bezlaktózová úprava", "price": 10.0, "priceFormatted": "+10 €"},
]

COMMON_ZDOBENIE = [
    {"id": "zdob-zapich-cislo", "name": "Personalizovaný zápich s číslom", "price": 6.0, "priceFormatted": "+6 €"},
    {"id": "zdob-zapich-meno", "name": "Personalizovaný zápich s menom", "price": 12.0, "priceFormatted": "+12 €"},
    {"id": "zdob-postavicka", "name": "Personalizovaná postavička", "price": 15.0, "priceFormatted": "+15 €"},
    {"id": "zdob-coko-zapich", "name": "Personalizovaný čoko zápich", "price": 10.0, "priceFormatted": "+10 €"},
]

def format_price(amount):
    if amount == int(amount):
        return f"{int(amount)} €"
    return f"{amount:.2f}".replace('.', ',') + " €"

def generate():
    raw_items = parse_files()
    products_output = []
    
    # Track existing images
    images_dir = "/Users/filip/Desktop/weby /hanela/public/images/products"
    
    for item in raw_items:
        name = fix_text(item['name']).strip()
        slug = slugify(name)
        cat = item['detected_category']
        raw_price = item.get('price', 0) / 100.0
        
        # Base price adjustment for custom cake
        if name == "TORTA podľa vlastného výberu" and raw_price == 0:
            raw_price = 25.0
            
        desc = fix_text(item.get('description', '')).strip()
        subcat = determine_subcategory(cat, name)
        
        # Handle images
        medias = item.get('medias', [])
        image_list = []
        for idx, m in enumerate(medias):
            if idx == 0:
                fn = f"{slug}.jpg"
            else:
                fn = f"{slug}-{idx+1}.jpg"
            
            # verify if exists or fallback
            if os.path.exists(os.path.join(images_dir, fn)):
                image_list.append(f"/images/products/{fn}")
            elif idx == 0 and os.path.exists(os.path.join(images_dir, f"{slug}.png")):
                image_list.append(f"/images/products/{slug}.png")
                
        if not image_list:
            # fallback to primary slug
            image_list = [f"/images/products/{slug}.jpg"]
            
        primary_image = image_list[0]
        
        # Servings & min quantity
        min_qty = 1
        servings = None
        tag = None
        is_popular = False
        
        if cat == 'zakusky':
            min_qty = 5
            servings = "min. 5 ks z druhu"
            if not desc or "minimálne množstvo" not in desc.lower():
                desc = desc + "\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu."
            if any(k in name.lower() for k in ["nanuk", "tartaletk", "veterník", "venček", "pavlovka"]):
                is_popular = True
        elif cat == 'mix':
            min_qty = 1
            tag = "Týždenná limitka"
            is_popular = True
            m_serv = re.search(r'(\d+)\s*ks', name, re.IGNORECASE)
            if m_serv:
                servings = f"{m_serv.group(1)} ks"
            else:
                servings = "výber mixu"
        elif cat == 'torty-mieru':
            min_qty = 1
            if "srdce" in name.lower():
                servings = "20 porcií (srdce)"
                tag = "Obľúbený tvar"
                is_popular = True
            elif "2.poschodová" in name.lower() or "2 poschod" in name.lower():
                servings = "30+ porcií (2 poschodia)"
            elif "3.poschodová" in name.lower() or "3 poschod" in name.lower():
                servings = "50+ porcií (3 poschodia)"
                tag = "Svadobná dominant"
            else:
                servings = "od 4 do 30 porcií"
                tag = "Najviac obľúbené"
                is_popular = True
        elif cat == 'torty-cheesecakes':
            min_qty = 1
            if "karamelový venček" in name.lower():
                servings = "12–16 porcií"
            else:
                servings = "12–16 porcií"
            if "bezlepková" in name.lower():
                tag = "Bezlepková"
            elif any(k in name.lower() for k in ["malinová", "mangový", "pistáciový", "red velvet"]):
                is_popular = True
                
        # Generate options for custom cakes
        option_groups = None
        if cat == 'torty-mieru':
            option_groups = []
            
            # Size option if it's the customizable base cake
            if name == "TORTA podľa vlastného výberu":
                option_groups.append({
                    "id": "size",
                    "title": "Veľkosť torty a počet porcií",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"id": "size-4", "name": "4 porcie (mini torta)", "price": 0, "priceFormatted": "v cene (25 €)"},
                        {"id": "size-10", "name": "do 10 porcií (Ø 17 cm)", "price": 35.0, "priceFormatted": "+35 € (spolu 60 €)"},
                        {"id": "size-15", "name": "10–15 porcií (Ø 21 cm)", "price": 55.0, "priceFormatted": "+55 € (spolu 80 €)"},
                        {"id": "size-20", "name": "16–20 porcií (Ø 24 cm)", "price": 75.0, "priceFormatted": "+75 € (spolu 100 €)"},
                        {"id": "size-30", "name": "24–30 porcií (Ø 27 cm)", "price": 95.0, "priceFormatted": "+95 € (spolu 120 €)"},
                    ]
                })
                
            # Korpus selection
            option_groups.append({
                "id": "korpus",
                "title": "Výber korpusu (cesto)",
                "type": "select",
                "required": True,
                "options": COMMON_KORPUS
            })
            
            # Krem selection
            option_groups.append({
                "id": "krem",
                "title": "Výber krému",
                "type": "select",
                "required": True,
                "options": COMMON_KREM
            })
            
            # Doplnky & ovocie
            option_groups.append({
                "id": "doplnky",
                "title": "Doplnky & Ovocné redukcie",
                "type": "checkbox",
                "required": False,
                "options": COMMON_DOPLNKY
            })
            
            # Intolerance
            option_groups.append({
                "id": "diet",
                "title": "Špeciálna diéta / intolerancia",
                "type": "checkbox",
                "required": False,
                "options": COMMON_DIET
            })
            
            # Zdobenie
            option_groups.append({
                "id": "zdobenie",
                "title": "Personalizované zdobenie & Zápichy",
                "type": "checkbox",
                "required": False,
                "options": COMMON_ZDOBENIE
            })
            
            # Note / Custom instructions
            option_groups.append({
                "id": "note",
                "title": "Poznámka k torte & nápis",
                "type": "text",
                "required": False,
                "placeholder": "Napr. farba zápichu, meno a vek oslávenca, špeciálne venovanie..."
            })
            
        prod_obj = {
            "id": item['id'],
            "name": name,
            "slug": slug,
            "price": raw_price,
            "priceFormatted": format_price(raw_price),
            "description": desc.strip(),
            "category": cat,
            "subcategory": subcat,
            "image": primary_image,
            "images": image_list,
            "minQuantity": min_qty,
        }
        
        if tag:
            prod_obj["tag"] = tag
        if is_popular:
            prod_obj["isPopular"] = True
        if servings:
            prod_obj["servings"] = servings
        if option_groups:
            prod_obj["options"] = option_groups
            
        products_output.append(prod_obj)
        
    # Sort order: mix first, torty-mieru, torty-cheesecakes, zakusky
    cat_order = {"mix": 0, "torty-mieru": 1, "torty-cheesecakes": 2, "zakusky": 3}
    products_output.sort(key=lambda x: (cat_order.get(x['category'], 99), -x.get('isPopular', False), x['price']))
    
    ts_content = '''export interface OptionItem {
  id: string;
  name: string;
  price: number;
  priceFormatted?: string;
}

export interface OptionGroup {
  id: string;
  title: string;
  type: "select" | "checkbox" | "text";
  required?: boolean;
  options?: OptionItem[];
  placeholder?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  priceFormatted: string;
  description: string;
  category: "mix" | "torty-mieru" | "torty-cheesecakes" | "zakusky";
  subcategory: string;
  image: string;
  images: string[];
  tag?: string;
  isPopular?: boolean;
  servings?: string;
  minQuantity?: number;
  options?: OptionGroup[];
}

export interface CategoryDefinition {
  id: "mix" | "torty-mieru" | "torty-cheesecakes" | "zakusky";
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  subcategories: string[];
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: "mix",
    title: "Víkendové degustačné mixy",
    shortTitle: "Víkendové mixy",
    badge: "Týždenná limitka",
    description: "Čerstvé krabičky vybraných zákuskov s odberom v piatok a sobotu vo Viničnom.",
    subcategories: ["Všetky"],
  },
  {
    id: "torty-mieru",
    title: "Torty na mieru & Svadobné",
    shortTitle: "Torty na mieru",
    badge: "Svadby & Oslavy",
    description: "Poschodové svadobné dominanty a slávnostné torty vyrábané presne podľa vášho zadania.",
    subcategories: ["Všetky", "Torty na oslavy", "Poschodové svadobné"],
  },
  {
    id: "torty-cheesecakes",
    title: "Celé torty & Cheesecakes (12–16 porcií)",
    shortTitle: "Celé torty & Cheesecakes",
    badge: "Rodinné oslavy",
    description: "Poctivé torty s mascarpone krémom a pravou čokoládou pre rodinné oslavy a narodeniny.",
    subcategories: ["Všetky", "Ovocné a svieže", "Čokoládové a orechové", "Cheesecakes & Špeciály"],
  },
  {
    id: "zakusky",
    title: "Kusové zákusky & Mini dezerty",
    shortTitle: "Kusové zákusky",
    badge: "Candy bar & Catering",
    description: "Remeselné mini dezerty, tartaletky a tradičné rezy pečené výhradne z farmárskeho masla.",
    subcategories: ["Všetky", "Odpaľované & Choux", "Tartaletky & Mini dezerty", "Tradičné rezy & Klasika"],
  },
];

export const PRODUCTS: Product[] = ''' + json.dumps(products_output, ensure_ascii=False, indent=2) + ';\n'

    with open('/Users/filip/Desktop/weby /hanela/src/data/products.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)
        
    print(f"Generated products.ts with {len(products_output)} products!")

if __name__ == '__main__':
    generate()
