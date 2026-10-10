import json
import re
import os
import unicodedata
import urllib.request
import subprocess

CATEGORY_MAP = {
    'cmezzaxh0000hl5044kk1f20c': 'torty-mieru',
    'cmfozirsx0005jp04k9q19rp3': 'zakusky',
    'cmfozlv9o0000kw0434fe176a': 'torty-cheesecakes',
    'cmobiuejr000004jr3f5agn34': 'mix'
}

SUBCATEGORY_MAP = {
    'torty-mieru': {
        'default': 'Torty na oslavy',
        'poschodova': 'Poschodové svadobné'
    },
    'torty-cheesecakes': {
        'default': 'Ovocné a svieže',
        'cheesecake': 'Cheesecakes & Špeciály',
        'cokolada': 'Čokoládové a orechové'
    },
    'zakusky': {
        'choux': 'Odpaľované & Choux',
        'tartaletky': 'Tartaletky & Mini dezerty',
        'rezy': 'Tradičné rezy & Klasika'
    },
    'mix': {
        'default': 'Víkendové boxy'
    }
}

def fix_text(val):
    if not isinstance(val, str):
        return val
    try:
        return val.encode('latin1').decode('utf-8')
    except:
        try:
            return val.encode('cp1252').decode('utf-8')
        except:
            return val

def slugify(text):
    text = fix_text(text)
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def determine_subcategory(category, name):
    name_l = name.lower()
    if category == 'torty-mieru':
        if 'poschodov' in name_l:
            return 'Poschodové svadobné'
        return 'Torty na oslavy'
    elif category == 'torty-cheesecakes':
        if 'cheesecake' in name_l:
            return 'Cheesecakes & Špeciály'
        if any(x in name_l for x in ['cokolad', 'čokolád', 'orech', 'gaštan', 'red velvet']):
            return 'Čokoládové a orechové'
        return 'Ovocné a svieže'
    elif category == 'zakusky':
        if any(x in name_l for x in ['veterník', 'venček', 'choux', 'craquelin', 'profiterolk', 'éclair']):
            return 'Odpaľované & Choux'
        if any(x in name_l for x in ['tartaletk', 'pavlovka', 'nanuk', 'košíčk', 'laskonk', 'parížske', 'panacotta', 'brownies']):
            return 'Tartaletky & Mini dezerty'
        return 'Tradičné rezy & Klasika'
    return 'Víkendové boxy'

def parse_files():
    files = [
        ('/Users/filip/.gemini/antigravity/brain/d6acf71a-2cbc-457e-b20f-7fde4818b364/.system_generated/steps/356/content.md', 'torty-mieru'),
        ('/Users/filip/.gemini/antigravity/brain/d6acf71a-2cbc-457e-b20f-7fde4818b364/.system_generated/steps/357/content.md', 'zakusky'),
        ('/Users/filip/.gemini/antigravity/brain/d6acf71a-2cbc-457e-b20f-7fde4818b364/.system_generated/steps/358/content.md', 'torty-cheesecakes'),
        ('/Users/filip/.gemini/antigravity/brain/d6acf71a-2cbc-457e-b20f-7fde4818b364/.system_generated/steps/359/content.md', 'mix')
    ]
    
    products_by_id = {}
    
    for filepath, default_cat in files:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as fp:
            txt = fp.read()
            
        chunks = re.findall(r'self\.__next_f\.push\(\[1,\s*\"(.*?)\"\]\)', txt)
        full_text = ''
        for c in chunks:
            try:
                full_text += bytes(c, 'utf-8').decode('unicode_escape')
            except:
                full_text += c
                
        idx = 0
        while True:
            idx = full_text.find('"products":{"items":[', idx)
            if idx == -1:
                break
            start = idx + len('"products":{"items":[') - 1
            depth = 0
            end = -1
            for i in range(start, len(full_text)):
                if full_text[i] == '[':
                    depth += 1
                elif full_text[i] == ']':
                    depth -= 1
                    if depth == 0:
                        end = i + 1
                        break
            if end != -1:
                try:
                    items = json.loads(full_text[start:end])
                    for item in items:
                        item['detected_category'] = default_cat
                        products_by_id[item['id']] = item
                except Exception as e:
                    print(f"Error parsing JSON in {filepath}: {e}")
            idx += 1
            
    return list(products_by_id.values())

if __name__ == '__main__':
    items = parse_files()
    print(f"Parsed {len(items)} products successfully.")
    for p in items:
        opt_names = [o.get('text') for o in p.get('options', [])]
        print(f"- {p['name']} ({p['detected_category']}): {len(p.get('medias', []))} photos, options: {opt_names}")
