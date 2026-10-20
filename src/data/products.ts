export interface OptionItem {
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
    description: "Remeselné mini dezerty, tartaletky a tradičné rezy pečené výhradne z 82% masla.",
    subcategories: ["Všetky", "Odpaľované & Choux", "Tartaletky & Mini dezerty", "Tradičné rezy & Klasika"],
  }
];

export const PRODUCTS: Product[] = [
  {
    "id": "cmezzaxhc000rl504oxsqf02f",
    "name": "Mix zákuskov 9ks",
    "slug": "mix-zakuskov-9ks",
    "price": 20.0,
    "priceFormatted": "20 €",
    "description": "Mix rôznych druhov podľa aktuálnej dennej ponuky.",
    "category": "mix",
    "subcategory": "Víkendové boxy",
    "image": "/images/products/mix-zakuskov-9ks.webp",
    "images": [
      "/images/products/mix-zakuskov-9ks.webp"
    ],
    "minQuantity": 1,
    "tag": "Týždenná limitka",
    "isPopular": true,
    "servings": "9 ks"
  },
  {
    "id": "cmgaq6vdt001zky04dnuv9onz",
    "name": "Mix zákuskov 16 ks",
    "slug": "mix-zakuskov-16-ks",
    "price": 34.0,
    "priceFormatted": "34 €",
    "description": "Mix rôznych druhov podľa aktuálnej dennej ponuky.",
    "category": "mix",
    "subcategory": "Víkendové boxy",
    "image": "/images/products/mix-zakuskov-16-ks.webp",
    "images": [
      "/images/products/mix-zakuskov-16-ks.webp"
    ],
    "minQuantity": 1,
    "tag": "Týždenná limitka",
    "isPopular": true,
    "servings": "16 ks"
  },
  {
    "id": "cmgaq8ol1002lky04jhtwrxg1",
    "name": "Mix zákuskov 24 ks",
    "slug": "mix-zakuskov-24-ks",
    "price": 50.0,
    "priceFormatted": "50 €",
    "description": "Mix rôznych druhov podľa aktuálnej dennej ponuky.",
    "category": "mix",
    "subcategory": "Víkendové boxy",
    "image": "/images/products/mix-zakuskov-24-ks.webp",
    "images": [
      "/images/products/mix-zakuskov-24-ks.webp",
      "/images/products/mix-zakuskov-24-ks-2.webp"
    ],
    "minQuantity": 1,
    "tag": "Týždenná limitka",
    "isPopular": true,
    "servings": "24 ks"
  },
  {
    "id": "cmghtpo1h000wjy04zotr7kjf",
    "name": "TORTA podľa vlastného výberu",
    "slug": "torta-podla-vlastneho-vyberu",
    "price": 25.0,
    "priceFormatted": "25 €",
    "description": "Každá torta je jedinečná – rovnako ako Vy. Preto si môžete svoju vysnívanú tortu vyskladať presne podľa svojich predstáv. Stačí si len vybrať.",
    "category": "torty-mieru",
    "subcategory": "Torty na oslavy",
    "image": "/images/products/torta-podla-vlastneho-vyberu.webp",
    "images": [
      "/images/products/torta-podla-vlastneho-vyberu.webp",
      "/images/products/torta-podla-vlastneho-vyberu-2.webp",
      "/images/products/torta-podla-vlastneho-vyberu-3.webp"
    ],
    "minQuantity": 1,
    "tag": "Najviac obľúbené",
    "isPopular": true,
    "servings": "od 4 do 30 porcií",
    "options": [
      {
        "id": "size",
        "title": "Veľkosť torty a počet porcií",
        "type": "select",
        "required": true,
        "options": [
          {
            "id": "size-4",
            "name": "4 porcie (mini torta)",
            "price": 0,
            "priceFormatted": "v cene (25 €)"
          },
          {
            "id": "size-10",
            "name": "do 10 porcií (Ø 17 cm)",
            "price": 35.0,
            "priceFormatted": "+35 € (spolu 60 €)"
          },
          {
            "id": "size-15",
            "name": "10–15 porcií (Ø 21 cm)",
            "price": 55.0,
            "priceFormatted": "+55 € (spolu 80 €)"
          },
          {
            "id": "size-20",
            "name": "16–20 porcií (Ø 24 cm)",
            "price": 75.0,
            "priceFormatted": "+75 € (spolu 100 €)"
          },
          {
            "id": "size-30",
            "name": "24–30 porcií (Ø 27 cm)",
            "price": 95.0,
            "priceFormatted": "+95 € (spolu 120 €)"
          }
        ]
      },
      {
        "id": "korpus",
        "title": "Výber korpusu (cesto)",
        "type": "select",
        "required": true,
        "options": [
          {
            "id": "korpus-piskot",
            "name": "Piškótový",
            "price": 0
          },
          {
            "id": "korpus-mandel",
            "name": "Mandľový",
            "price": 0
          },
          {
            "id": "korpus-kakao",
            "name": "Kakaový",
            "price": 0
          },
          {
            "id": "korpus-pistacia",
            "name": "Pistáciový",
            "price": 0
          },
          {
            "id": "korpus-coko-kúsky",
            "name": "Piškót s kúskami čokolády",
            "price": 0
          },
          {
            "id": "korpus-orech",
            "name": "Orechový",
            "price": 0
          },
          {
            "id": "korpus-mak",
            "name": "Makový",
            "price": 0
          }
        ]
      },
      {
        "id": "krem",
        "title": "Výber krému",
        "type": "select",
        "required": true,
        "options": [
          {
            "id": "krem-mascarpone-biela-coko",
            "name": "Mascarpone s bielou čokoládou",
            "price": 0
          },
          {
            "id": "krem-cokoladovy",
            "name": "Čokoládový",
            "price": 0
          },
          {
            "id": "krem-nutelovy",
            "name": "Nutelový",
            "price": 0
          },
          {
            "id": "krem-gastanovy",
            "name": "Gaštanový",
            "price": 0
          },
          {
            "id": "krem-karamelovy",
            "name": "Karamelový",
            "price": 0
          },
          {
            "id": "krem-orieskovy",
            "name": "Orieškový",
            "price": 0
          },
          {
            "id": "krem-pistaciovy",
            "name": "Pistáciový",
            "price": 0
          },
          {
            "id": "krem-kokosovy",
            "name": "Kokosový",
            "price": 0
          }
        ]
      },
      {
        "id": "doplnky",
        "title": "Doplnky & Ovocné redukcie",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "doplnok-slany-karamel",
            "name": "Slaný karamel",
            "price": 0
          },
          {
            "id": "doplnok-malinova-redukcia",
            "name": "Malinová redukcia",
            "price": 0
          },
          {
            "id": "doplnok-mix-ovocia",
            "name": "Mix ovocia redukcia",
            "price": 0
          },
          {
            "id": "doplnok-mangova-redukcia",
            "name": "Mangová redukcia",
            "price": 0
          },
          {
            "id": "doplnok-jahody",
            "name": "Čerstvé jahody",
            "price": 0
          },
          {
            "id": "doplnok-cucoriedky",
            "name": "Čučoriedky",
            "price": 0
          },
          {
            "id": "doplnok-marhulovy-dzem",
            "name": "Marhuľový džem",
            "price": 0
          },
          {
            "id": "doplnok-malinovy-dzem",
            "name": "Malinový džem",
            "price": 0
          },
          {
            "id": "doplnok-jahodovy-dzem",
            "name": "Jahodový džem",
            "price": 0
          },
          {
            "id": "doplnok-visne",
            "name": "Višne",
            "price": 0
          }
        ]
      },
      {
        "id": "diet",
        "title": "Špeciálna diéta / intolerancia",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "diet-bezlepkova",
            "name": "Bezlepková úprava",
            "price": 5.0,
            "priceFormatted": "+5 €"
          },
          {
            "id": "diet-bezlaktozova",
            "name": "Bezlaktózová úprava",
            "price": 10.0,
            "priceFormatted": "+10 €"
          }
        ]
      },
      {
        "id": "zdobenie",
        "title": "Personalizované zdobenie & Zápichy",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "zdob-zapich-cislo",
            "name": "Personalizovaný zápich s číslom",
            "price": 6.0,
            "priceFormatted": "+6 €"
          },
          {
            "id": "zdob-zapich-meno",
            "name": "Personalizovaný zápich s menom",
            "price": 12.0,
            "priceFormatted": "+12 €"
          }
        ]
      },
      {
        "id": "note",
        "title": "Poznámka k torte & nápis",
        "type": "text",
        "required": false,
        "placeholder": "Napr. farba zápichu, meno a vek oslávenca, špeciálne venovanie..."
      }
    ]
  },
  {
    "id": "cmh0kyitm0015l7047fqjahlu",
    "name": "TORTA srdce 20 porcií",
    "slug": "torta-srdce-20-porcii",
    "price": 100.0,
    "priceFormatted": "100 €",
    "description": "Každá torta je jedinečná – rovnako ako Vy. Preto si môžete svoju vysnívanú tortu vyskladať presne podľa svojich predstáv. Stačí si len vybrať.",
    "category": "torty-mieru",
    "subcategory": "Torty na oslavy",
    "image": "/images/products/torta-srdce-20-porcii.webp",
    "images": [
      "/images/products/torta-srdce-20-porcii.webp"
    ],
    "minQuantity": 1,
    "tag": "Obľúbený tvar",
    "isPopular": true,
    "servings": "20 porcií (srdce)",
    "options": [
      {
        "id": "korpus",
        "title": "Výber korpusu (cesto)",
        "type": "select",
        "required": true,
        "options": [
          {
            "id": "korpus-piskot",
            "name": "Piškótový",
            "price": 0
          },
          {
            "id": "korpus-mandel",
            "name": "Mandľový",
            "price": 0
          },
          {
            "id": "korpus-kakao",
            "name": "Kakaový",
            "price": 0
          },
          {
            "id": "korpus-pistacia",
            "name": "Pistáciový",
            "price": 0
          },
          {
            "id": "korpus-coko-kúsky",
            "name": "Piškót s kúskami čokolády",
            "price": 0
          },
          {
            "id": "korpus-orech",
            "name": "Orechový",
            "price": 0
          },
          {
            "id": "korpus-mak",
            "name": "Makový",
            "price": 0
          }
        ]
      },
      {
        "id": "krem",
        "title": "Výber krému",
        "type": "select",
        "required": true,
        "options": [
          {
            "id": "krem-mascarpone-biela-coko",
            "name": "Mascarpone s bielou čokoládou",
            "price": 0
          },
          {
            "id": "krem-cokoladovy",
            "name": "Čokoládový",
            "price": 0
          },
          {
            "id": "krem-nutelovy",
            "name": "Nutelový",
            "price": 0
          },
          {
            "id": "krem-gastanovy",
            "name": "Gaštanový",
            "price": 0
          },
          {
            "id": "krem-karamelovy",
            "name": "Karamelový",
            "price": 0
          },
          {
            "id": "krem-orieskovy",
            "name": "Orieškový",
            "price": 0
          },
          {
            "id": "krem-pistaciovy",
            "name": "Pistáciový",
            "price": 0
          },
          {
            "id": "krem-kokosovy",
            "name": "Kokosový",
            "price": 0
          }
        ]
      },
      {
        "id": "doplnky",
        "title": "Doplnky & Ovocné redukcie",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "doplnok-slany-karamel",
            "name": "Slaný karamel",
            "price": 0
          },
          {
            "id": "doplnok-malinova-redukcia",
            "name": "Malinová redukcia",
            "price": 0
          },
          {
            "id": "doplnok-mix-ovocia",
            "name": "Mix ovocia redukcia",
            "price": 0
          },
          {
            "id": "doplnok-mangova-redukcia",
            "name": "Mangová redukcia",
            "price": 0
          },
          {
            "id": "doplnok-jahody",
            "name": "Čerstvé jahody",
            "price": 0
          },
          {
            "id": "doplnok-cucoriedky",
            "name": "Čučoriedky",
            "price": 0
          },
          {
            "id": "doplnok-marhulovy-dzem",
            "name": "Marhuľový džem",
            "price": 0
          },
          {
            "id": "doplnok-malinovy-dzem",
            "name": "Malinový džem",
            "price": 0
          },
          {
            "id": "doplnok-jahodovy-dzem",
            "name": "Jahodový džem",
            "price": 0
          },
          {
            "id": "doplnok-visne",
            "name": "Višne",
            "price": 0
          }
        ]
      },
      {
        "id": "diet",
        "title": "Špeciálna diéta / intolerancia",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "diet-bezlepkova",
            "name": "Bezlepková úprava",
            "price": 5.0,
            "priceFormatted": "+5 €"
          },
          {
            "id": "diet-bezlaktozova",
            "name": "Bezlaktózová úprava",
            "price": 10.0,
            "priceFormatted": "+10 €"
          }
        ]
      },
      {
        "id": "zdobenie",
        "title": "Personalizované zdobenie & Zápichy",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "zdob-zapich-cislo",
            "name": "Personalizovaný zápich s číslom",
            "price": 6.0,
            "priceFormatted": "+6 €"
          },
          {
            "id": "zdob-zapich-meno",
            "name": "Personalizovaný zápich s menom",
            "price": 12.0,
            "priceFormatted": "+12 €"
          }
        ]
      },
      {
        "id": "note",
        "title": "Poznámka k torte & nápis",
        "type": "text",
        "required": false,
        "placeholder": "Napr. farba zápichu, meno a vek oslávenca, špeciálne venovanie..."
      }
    ]
  },
  {
    "id": "cmh34h6l100aqkw04whqcd2aw",
    "name": "TORTA podľa vlastného výberu - 2.poschodová (30 a viac porcií)",
    "slug": "torta-podla-vlastneho-vyberu-2poschodova-30-a-viac-porcii",
    "price": 160.0,
    "priceFormatted": "160 €",
    "description": "V prípade záujmu o 2 poschodovú tortu nás neváhajte kontaktovať na telefónnom čísle 0910960913\nĎakujeme",
    "category": "torty-mieru",
    "subcategory": "Poschodové svadobné",
    "image": "/images/products/torta-podla-vlastneho-vyberu-2poschodova-30-a-viac-porcii.webp",
    "images": [
      "/images/products/torta-podla-vlastneho-vyberu-2poschodova-30-a-viac-porcii.webp"
    ],
    "minQuantity": 1,
    "servings": "30+ porcií (2 poschodia)",
    "options": [
      {
        "id": "korpus",
        "title": "Výber korpusu (cesto)",
        "type": "select",
        "required": true,
        "options": [
          {
            "id": "korpus-piskot",
            "name": "Piškótový",
            "price": 0
          },
          {
            "id": "korpus-mandel",
            "name": "Mandľový",
            "price": 0
          },
          {
            "id": "korpus-kakao",
            "name": "Kakaový",
            "price": 0
          },
          {
            "id": "korpus-pistacia",
            "name": "Pistáciový",
            "price": 0
          },
          {
            "id": "korpus-coko-kúsky",
            "name": "Piškót s kúskami čokolády",
            "price": 0
          },
          {
            "id": "korpus-orech",
            "name": "Orechový",
            "price": 0
          },
          {
            "id": "korpus-mak",
            "name": "Makový",
            "price": 0
          }
        ]
      },
      {
        "id": "krem",
        "title": "Výber krému",
        "type": "select",
        "required": true,
        "options": [
          {
            "id": "krem-mascarpone-biela-coko",
            "name": "Mascarpone s bielou čokoládou",
            "price": 0
          },
          {
            "id": "krem-cokoladovy",
            "name": "Čokoládový",
            "price": 0
          },
          {
            "id": "krem-nutelovy",
            "name": "Nutelový",
            "price": 0
          },
          {
            "id": "krem-gastanovy",
            "name": "Gaštanový",
            "price": 0
          },
          {
            "id": "krem-karamelovy",
            "name": "Karamelový",
            "price": 0
          },
          {
            "id": "krem-orieskovy",
            "name": "Orieškový",
            "price": 0
          },
          {
            "id": "krem-pistaciovy",
            "name": "Pistáciový",
            "price": 0
          },
          {
            "id": "krem-kokosovy",
            "name": "Kokosový",
            "price": 0
          }
        ]
      },
      {
        "id": "doplnky",
        "title": "Doplnky & Ovocné redukcie",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "doplnok-slany-karamel",
            "name": "Slaný karamel",
            "price": 0
          },
          {
            "id": "doplnok-malinova-redukcia",
            "name": "Malinová redukcia",
            "price": 0
          },
          {
            "id": "doplnok-mix-ovocia",
            "name": "Mix ovocia redukcia",
            "price": 0
          },
          {
            "id": "doplnok-mangova-redukcia",
            "name": "Mangová redukcia",
            "price": 0
          },
          {
            "id": "doplnok-jahody",
            "name": "Čerstvé jahody",
            "price": 0
          },
          {
            "id": "doplnok-cucoriedky",
            "name": "Čučoriedky",
            "price": 0
          },
          {
            "id": "doplnok-marhulovy-dzem",
            "name": "Marhuľový džem",
            "price": 0
          },
          {
            "id": "doplnok-malinovy-dzem",
            "name": "Malinový džem",
            "price": 0
          },
          {
            "id": "doplnok-jahodovy-dzem",
            "name": "Jahodový džem",
            "price": 0
          },
          {
            "id": "doplnok-visne",
            "name": "Višne",
            "price": 0
          }
        ]
      },
      {
        "id": "diet",
        "title": "Špeciálna diéta / intolerancia",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "diet-bezlepkova",
            "name": "Bezlepková úprava",
            "price": 5.0,
            "priceFormatted": "+5 €"
          },
          {
            "id": "diet-bezlaktozova",
            "name": "Bezlaktózová úprava",
            "price": 10.0,
            "priceFormatted": "+10 €"
          }
        ]
      },
      {
        "id": "zdobenie",
        "title": "Personalizované zdobenie & Zápichy",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "zdob-zapich-cislo",
            "name": "Personalizovaný zápich s číslom",
            "price": 6.0,
            "priceFormatted": "+6 €"
          },
          {
            "id": "zdob-zapich-meno",
            "name": "Personalizovaný zápich s menom",
            "price": 12.0,
            "priceFormatted": "+12 €"
          }
        ]
      },
      {
        "id": "note",
        "title": "Poznámka k torte & nápis",
        "type": "text",
        "required": false,
        "placeholder": "Napr. farba zápichu, meno a vek oslávenca, špeciálne venovanie..."
      }
    ]
  },
  {
    "id": "cmh35k3cm0012ky044cks5cfz",
    "name": "TORTA podľa vlastného výberu - 3.poschodová (od 50 porcií)",
    "slug": "torta-podla-vlastneho-vyberu-3poschodova-od-50-porcii",
    "price": 210.0,
    "priceFormatted": "210 €",
    "description": "V prípade záujmu o 3.poschodovú tortu nás neváhajte kontaktovať na telefónnom čísle 0910960913\nĎakujeme",
    "category": "torty-mieru",
    "subcategory": "Poschodové svadobné",
    "image": "/images/products/torta-podla-vlastneho-vyberu-3poschodova-od-50-porcii.webp",
    "images": [
      "/images/products/torta-podla-vlastneho-vyberu-3poschodova-od-50-porcii.webp"
    ],
    "minQuantity": 1,
    "tag": "Svadobná dominant",
    "servings": "50+ porcií (3 poschodia)",
    "options": [
      {
        "id": "korpus",
        "title": "Výber korpusu (cesto)",
        "type": "select",
        "required": true,
        "options": [
          {
            "id": "korpus-piskot",
            "name": "Piškótový",
            "price": 0
          },
          {
            "id": "korpus-mandel",
            "name": "Mandľový",
            "price": 0
          },
          {
            "id": "korpus-kakao",
            "name": "Kakaový",
            "price": 0
          },
          {
            "id": "korpus-pistacia",
            "name": "Pistáciový",
            "price": 0
          },
          {
            "id": "korpus-coko-kúsky",
            "name": "Piškót s kúskami čokolády",
            "price": 0
          },
          {
            "id": "korpus-orech",
            "name": "Orechový",
            "price": 0
          },
          {
            "id": "korpus-mak",
            "name": "Makový",
            "price": 0
          }
        ]
      },
      {
        "id": "krem",
        "title": "Výber krému",
        "type": "select",
        "required": true,
        "options": [
          {
            "id": "krem-mascarpone-biela-coko",
            "name": "Mascarpone s bielou čokoládou",
            "price": 0
          },
          {
            "id": "krem-cokoladovy",
            "name": "Čokoládový",
            "price": 0
          },
          {
            "id": "krem-nutelovy",
            "name": "Nutelový",
            "price": 0
          },
          {
            "id": "krem-gastanovy",
            "name": "Gaštanový",
            "price": 0
          },
          {
            "id": "krem-karamelovy",
            "name": "Karamelový",
            "price": 0
          },
          {
            "id": "krem-orieskovy",
            "name": "Orieškový",
            "price": 0
          },
          {
            "id": "krem-pistaciovy",
            "name": "Pistáciový",
            "price": 0
          },
          {
            "id": "krem-kokosovy",
            "name": "Kokosový",
            "price": 0
          }
        ]
      },
      {
        "id": "doplnky",
        "title": "Doplnky & Ovocné redukcie",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "doplnok-slany-karamel",
            "name": "Slaný karamel",
            "price": 0
          },
          {
            "id": "doplnok-malinova-redukcia",
            "name": "Malinová redukcia",
            "price": 0
          },
          {
            "id": "doplnok-mix-ovocia",
            "name": "Mix ovocia redukcia",
            "price": 0
          },
          {
            "id": "doplnok-mangova-redukcia",
            "name": "Mangová redukcia",
            "price": 0
          },
          {
            "id": "doplnok-jahody",
            "name": "Čerstvé jahody",
            "price": 0
          },
          {
            "id": "doplnok-cucoriedky",
            "name": "Čučoriedky",
            "price": 0
          },
          {
            "id": "doplnok-marhulovy-dzem",
            "name": "Marhuľový džem",
            "price": 0
          },
          {
            "id": "doplnok-malinovy-dzem",
            "name": "Malinový džem",
            "price": 0
          },
          {
            "id": "doplnok-jahodovy-dzem",
            "name": "Jahodový džem",
            "price": 0
          },
          {
            "id": "doplnok-visne",
            "name": "Višne",
            "price": 0
          }
        ]
      },
      {
        "id": "diet",
        "title": "Špeciálna diéta / intolerancia",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "diet-bezlepkova",
            "name": "Bezlepková úprava",
            "price": 5.0,
            "priceFormatted": "+5 €"
          },
          {
            "id": "diet-bezlaktozova",
            "name": "Bezlaktózová úprava",
            "price": 10.0,
            "priceFormatted": "+10 €"
          }
        ]
      },
      {
        "id": "zdobenie",
        "title": "Personalizované zdobenie & Zápichy",
        "type": "checkbox",
        "required": false,
        "options": [
          {
            "id": "zdob-zapich-cislo",
            "name": "Personalizovaný zápich s číslom",
            "price": 6.0,
            "priceFormatted": "+6 €"
          },
          {
            "id": "zdob-zapich-meno",
            "name": "Personalizovaný zápich s menom",
            "price": 12.0,
            "priceFormatted": "+12 €"
          }
        ]
      },
      {
        "id": "note",
        "title": "Poznámka k torte & nápis",
        "type": "text",
        "required": false,
        "placeholder": "Napr. farba zápichu, meno a vek oslávenca, špeciálne venovanie..."
      }
    ]
  },
  {
    "id": "cmezzaxhy000zl504ll3thsjs",
    "name": "Mangový cheesecake, 12-16 porcíí",
    "slug": "mangovy-cheesecake-12-16-porcii",
    "price": 43.0,
    "priceFormatted": "43 €",
    "description": "Zamatovo hladký cheesecake s dotykom sviežeho manga. Dokonalá harmónia krémovosti a ľahkosti v každom súste.",
    "category": "torty-cheesecakes",
    "subcategory": "Cheesecakes & Špeciály",
    "image": "/images/products/mangovy-cheesecake-12-16-porcii.webp",
    "images": [
      "/images/products/mangovy-cheesecake-12-16-porcii.webp",
      "/images/products/mangovy-cheesecake-12-16-porcii-2.webp"
    ],
    "minQuantity": 1,
    "isPopular": true,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmezzaxhx000vl504ic60hvrf",
    "name": "Pistáciový cheesecake, 12-16 porcíí",
    "slug": "pistaciovy-cheesecake-12-16-porcii",
    "price": 43.0,
    "priceFormatted": "43 €",
    "description": "Jemný, krémový a plný orechovej chuti. Pistáciový cheesecake spája lahodnú krémovosť s výraznou chuťou pražených pistácií – dezert pre skutočných gurmánov.",
    "category": "torty-cheesecakes",
    "subcategory": "Cheesecakes & Špeciály",
    "image": "/images/products/pistaciovy-cheesecake-12-16-porcii.webp",
    "images": [
      "/images/products/pistaciovy-cheesecake-12-16-porcii.webp"
    ],
    "minQuantity": 1,
    "isPopular": true,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmezzaxhc000pl504otzpto9d",
    "name": "Malinová torta, 12-16 porcií",
    "slug": "malinova-torta-12-16-porcii",
    "price": 45.0,
    "priceFormatted": "45 €",
    "description": "Mandľový korpus, malinová redukcia a mascarpone s bielou čokoládou\n\nPriemer: 26 cm \nPočet porcií: 12-16 ks\nHmotnosť: od 2-2,5 kg\nVýška: cca 6-7 cm",
    "category": "torty-cheesecakes",
    "subcategory": "Ovocné a svieže",
    "image": "/images/products/malinova-torta-12-16-porcii.webp",
    "images": [
      "/images/products/malinova-torta-12-16-porcii.webp"
    ],
    "minQuantity": 1,
    "isPopular": true,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmgapo700000il504xzgpe2gk",
    "name": "Red Velvet torta",
    "slug": "red-velvet-torta",
    "price": 45.0,
    "priceFormatted": "45 €",
    "description": "Šťavnatý a vláčny korpus a tvarohovou náplňou. \n\nPriemer: 26 cm \nPočet porcií: 12-16 ks\nHmotnosť: od 2-2,5 kg\nVýška: cca 6-7 cm",
    "category": "torty-cheesecakes",
    "subcategory": "Čokoládové a orechové",
    "image": "/images/products/red-velvet-torta.webp",
    "images": [
      "/images/products/red-velvet-torta.webp",
      "/images/products/red-velvet-torta-2.webp"
    ],
    "minQuantity": 1,
    "isPopular": true,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmezzaxih0017l504yvn8wyxk",
    "name": "Karamelový venček",
    "slug": "karamelovy-vencek",
    "price": 35.0,
    "priceFormatted": "35 €",
    "description": "Nadýchané odpaľované cesto plnené jemným krémom a preliate karamelom. Karamelový venček – klasika, ktorá nikdy nesklame.",
    "category": "torty-cheesecakes",
    "subcategory": "Ovocné a svieže",
    "image": "/images/products/karamelovy-vencek.webp",
    "images": [
      "/images/products/karamelovy-vencek.webp"
    ],
    "minQuantity": 1,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmgutqi69000kl404izbrdbp0",
    "name": "Citrónový cheesecake, 12-16 porcíí",
    "slug": "citronovy-cheesecake-12-16-porcii",
    "price": 43.0,
    "priceFormatted": "43 €",
    "description": "Zamatovo hladký cheesecake s dotykom sviežeho citrónu. Dokonalá harmónia krémovosti a ľahkosti v každom súste.",
    "category": "torty-cheesecakes",
    "subcategory": "Cheesecakes & Špeciály",
    "image": "/images/products/citronovy-cheesecake-12-16-porcii.webp",
    "images": [
      "/images/products/citronovy-cheesecake-12-16-porcii.webp"
    ],
    "minQuantity": 1,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmhc337mt002vjv043jshanz7",
    "name": "Cheesecake gaštan",
    "slug": "cheesecake-gastan",
    "price": 43.0,
    "priceFormatted": "43 €",
    "description": "",
    "category": "torty-cheesecakes",
    "subcategory": "Cheesecakes & Špeciály",
    "image": "/images/products/cheesecake-gastan.webp",
    "images": [
      "/images/products/cheesecake-gastan.webp",
      "/images/products/cheesecake-gastan-2.webp"
    ],
    "minQuantity": 1,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmezzaxhz0011l504l5ngt8ll",
    "name": "Čokoládová torta, 12-16 porcíí",
    "slug": "cokoladova-torta-12-16-porcii",
    "price": 45.0,
    "priceFormatted": "45 €",
    "description": "Kakaový korpus, marhuľový džem a čokoládový krém. \n\nPriemer: 26 cm \nPočet porcií: 12-16 ks\nHmotnosť: od 2-2,5 kg\nVýška: cca 6-7 cm",
    "category": "torty-cheesecakes",
    "subcategory": "Čokoládové a orechové",
    "image": "/images/products/cokoladova-torta-12-16-porcii.webp",
    "images": [
      "/images/products/cokoladova-torta-12-16-porcii.webp",
      "/images/products/cokoladova-torta-12-16-porcii-2.webp"
    ],
    "minQuantity": 1,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmezzaxhc000nl5048xqa9v0w",
    "name": "Punčová torta, 12-16 porcíí",
    "slug": "puncova-torta-12-16-porcii",
    "price": 45.0,
    "priceFormatted": "45 €",
    "description": "Piškótový korpus, malinový džem, a ovocno-rumová zložka uprostred\n\nPriemer: 26 cm \nPočet porcií: 12-16 ks\nHmotnosť: od 2-2,5 kg\nVýška: cca 6-7 cm",
    "category": "torty-cheesecakes",
    "subcategory": "Ovocné a svieže",
    "image": "/images/products/puncova-torta-12-16-porcii.webp",
    "images": [
      "/images/products/puncova-torta-12-16-porcii.webp",
      "/images/products/puncova-torta-12-16-porcii-2.webp"
    ],
    "minQuantity": 1,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmgapexu5001al704s3q15zf5",
    "name": "Gaštanová torta",
    "slug": "gastanova-torta",
    "price": 45.0,
    "priceFormatted": "45 €",
    "description": "Kakaový korpus, gaštanový a karamelový krém. \n\nPriemer: 26 cm \nPočet porcií: 12-16 ks\nHmotnosť: od 2-2,5 kg\nVýška: cca 6-7 cm",
    "category": "torty-cheesecakes",
    "subcategory": "Čokoládové a orechové",
    "image": "/images/products/gastanova-torta.webp",
    "images": [
      "/images/products/gastanova-torta.webp",
      "/images/products/gastanova-torta-2.webp"
    ],
    "minQuantity": 1,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmgapgd200023l104x3j88gho",
    "name": "Medový krémeš",
    "slug": "medovy-kremes",
    "price": 45.0,
    "priceFormatted": "45 €",
    "description": "Medový plát, lahodný varený krém a šľahačka.\n\nPriemer: 26 cm \nPočet porcií: 12-16 ks\nHmotnosť: od 2-2,5 kg\nVýška: cca 6-7 cm",
    "category": "torty-cheesecakes",
    "subcategory": "Ovocné a svieže",
    "image": "/images/products/medovy-kremes.webp",
    "images": [
      "/images/products/medovy-kremes.webp"
    ],
    "minQuantity": 1,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmgapk4150047ld04r2wlu8la",
    "name": "Maková torta - bezlepková",
    "slug": "makova-torta-bezlepkova",
    "price": 45.0,
    "priceFormatted": "45 €",
    "description": "Makový korpus, mascarpone krém s višňami.\n\nPriemer: 26 cm \nPočet porcií: 12-16 ks\nHmotnosť: od 2-2,5 kg\nVýška: cca 6-7 cm",
    "category": "torty-cheesecakes",
    "subcategory": "Ovocné a svieže",
    "image": "/images/products/makova-torta-bezlepkova.webp",
    "images": [
      "/images/products/makova-torta-bezlepkova.webp",
      "/images/products/makova-torta-bezlepkova-2.webp"
    ],
    "minQuantity": 1,
    "tag": "Bezlepková",
    "servings": "12–16 porcií"
  },
  {
    "id": "cmgapm0er0002ju04wmdh7xms",
    "name": "Orechová torta",
    "slug": "orechova-torta",
    "price": 45.0,
    "priceFormatted": "45 €",
    "description": "Orechový korpus, marhuľový džem a karamelový krém.\n\nPriemer: 26 cm \nPočet porcií: 12-16 ks\nHmotnosť: od 2-2,5 kg\nVýška: cca 6-7 cm",
    "category": "torty-cheesecakes",
    "subcategory": "Čokoládové a orechové",
    "image": "/images/products/orechova-torta.webp",
    "images": [
      "/images/products/orechova-torta.webp",
      "/images/products/orechova-torta-2.webp"
    ],
    "minQuantity": 1,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmgaps2w8001bl404p8p94tdr",
    "name": "PavLOVE torta",
    "slug": "pavlove-torta",
    "price": 45.0,
    "priceFormatted": "45 €",
    "description": "Jemný snehový základ s lahodným mascarpone krémom a ovocím.\n\nPriemer: 26 cm \nPočet porcií: 12-16 ks\nHmotnosť: od 2-2,5 kg\nVýška: cca 6-7 cm",
    "category": "torty-cheesecakes",
    "subcategory": "Ovocné a svieže",
    "image": "/images/products/pavlove-torta.webp",
    "images": [
      "/images/products/pavlove-torta.webp"
    ],
    "minQuantity": 1,
    "servings": "12–16 porcií"
  },
  {
    "id": "cmezzaxhb000ll504ae315llg",
    "name": "Vanilkový venček",
    "slug": "vanilkovy-vencek",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Aby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je **5 kusov** z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Odpaľované & Choux",
    "image": "/images/products/vanilkovy-vencek.webp",
    "images": [
      "/images/products/vanilkovy-vencek.webp"
    ],
    "minQuantity": 5,
    "isPopular": true,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmezzaxhy000xl5041qmbrze0",
    "name": "Karamelový veterník, 100g",
    "slug": "karamelovy-veternik-100g",
    "price": 2.5,
    "priceFormatted": "2,50 €",
    "description": "Aby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je **5 kusov** z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Odpaľované & Choux",
    "image": "/images/products/karamelovy-veternik-100g.webp",
    "images": [
      "/images/products/karamelovy-veternik-100g.webp"
    ],
    "minQuantity": 5,
    "isPopular": true,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmezzaxhb000kl5049qur1s3a",
    "name": "Mini pavlovka - gaštanová",
    "slug": "mini-pavlovka-gastanova",
    "price": 2.5,
    "priceFormatted": "2,50 €",
    "description": "Aby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je **5 kusov** z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tartaletky & Mini dezerty",
    "image": "/images/products/mini-pavlovka-gastanova.webp",
    "images": [
      "/images/products/mini-pavlovka-gastanova.webp"
    ],
    "minQuantity": 5,
    "isPopular": true,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmezzaxhw000tl50425hh6upb",
    "name": "Pečený nanuk v bielej čokoláde",
    "slug": "peceny-nanuk-v-bielej-cokolade",
    "price": 2.5,
    "priceFormatted": "2,50 €",
    "description": "Aby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je **5 kusov** z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tartaletky & Mini dezerty",
    "image": "/images/products/peceny-nanuk-v-bielej-cokolade.webp",
    "images": [
      "/images/products/peceny-nanuk-v-bielej-cokolade.webp",
      "/images/products/peceny-nanuk-v-bielej-cokolade-2.webp"
    ],
    "minQuantity": 5,
    "isPopular": true,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgakr8zg000olb04upqs228t",
    "name": "Pistáciové tartaletky",
    "slug": "pistaciove-tartaletky",
    "price": 2.5,
    "priceFormatted": "2,50 €",
    "description": "Krehké košíčky plnené lahodným krémom a zdobené čerstvým ovocím.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tartaletky & Mini dezerty",
    "image": "/images/products/pistaciove-tartaletky.webp",
    "images": [
      "/images/products/pistaciove-tartaletky.webp"
    ],
    "minQuantity": 5,
    "isPopular": true,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgajs8q3002vla04a69v4k4y",
    "name": "Profiterolky",
    "slug": "profiterolky",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Jemný kúsok odpaľovaného cesta plnený lahodným krémom ozdobený čokoládovou polevou.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Odpaľované & Choux",
    "image": "/images/products/profiterolky.webp",
    "images": [
      "/images/products/profiterolky.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgakp9p9000wif043jwl6arw",
    "name": "Plnené košíčky - čokoládové",
    "slug": "plnene-kosicky-cokoladove",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Krehké cesto naplnené lahodným krémom a ozdobené ovocím či čokoládou.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tartaletky & Mini dezerty",
    "image": "/images/products/plnene-kosicky-cokoladove.webp",
    "images": [
      "/images/products/plnene-kosicky-cokoladove.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgaksekt001vjx047rt6r38w",
    "name": "Laskonky",
    "slug": "laskonky",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Sladká kombinácia orechového cesta a lahodnej krémovej náplne.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tartaletky & Mini dezerty",
    "image": "/images/products/laskonky.webp",
    "images": [
      "/images/products/laskonky.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgaktfus001cjx044h4fwiuj",
    "name": "Parížske rožky",
    "slug": "parizske-rozky",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Spojenie chrumkavého cesta, jemného krému a bohatej čokoládovej chuti.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tartaletky & Mini dezerty",
    "image": "/images/products/parizske-rozky.webp",
    "images": [
      "/images/products/parizske-rozky.webp",
      "/images/products/parizske-rozky-2.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgakvbc90001ia049ak9pjnz",
    "name": "Punčový rez",
    "slug": "puncovy-rez",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Klasika, ktorá Vás očarí svojimi lahodnými vrstvami, vôňou, rumom a jemnou sladkosťou.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tradičné rezy & Klasika",
    "image": "/images/products/puncovy-rez.webp",
    "images": [
      "/images/products/puncovy-rez.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgakxh6a000bl704d5bczkka",
    "name": "Doboška",
    "slug": "doboska",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Nadčasová cukrárska klasika s jemnou piškótou doplnená vrstvami lahodného čokoládového krému.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tradičné rezy & Klasika",
    "image": "/images/products/doboska.webp",
    "images": [
      "/images/products/doboska.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgaouil00002ju046eikm3iv",
    "name": "Kakaová roláda",
    "slug": "kakaova-rolada",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Nadýchaná kakaová roláda plná jemného krému a poctivej chuti kakaa.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tradičné rezy & Klasika",
    "image": "/images/products/kakaova-rolada.webp",
    "images": [
      "/images/products/kakaova-rolada.webp",
      "/images/products/kakaova-rolada-2.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgaovqo70006i3041zibhrn8",
    "name": "Gaštanový cheesecake",
    "slug": "gastanovy-cheesecake",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Lahodný gaštanovo-tvarohový dezert na krehkom sušienkovom základe.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tradičné rezy & Klasika",
    "image": "/images/products/gastanovy-cheesecake.webp",
    "images": [
      "/images/products/gastanovy-cheesecake.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgap2qb0000jju046kkq4gqv",
    "name": "Brownies",
    "slug": "brownies",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Ikonický čokoládový dezert v modernom prevedení. Možnosť objednania v mini verzii vo veľkosti 4x4, v srdiečkovom tvare (ideálne do candy baru na svadbu) alebo vo verzii klasik.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tartaletky & Mini dezerty",
    "image": "/images/products/brownies.webp",
    "images": [
      "/images/products/brownies.webp",
      "/images/products/brownies-2.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgap3k14000ql704ygkjga30",
    "name": "Šamrolky",
    "slug": "samrolky",
    "price": 2.0,
    "priceFormatted": "2 €",
    "description": "Chrumkavé trubičky z lístkového cesta plnené sladkým snehom.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tradičné rezy & Klasika",
    "image": "/images/products/samrolky.webp",
    "images": [
      "/images/products/samrolky.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgak0u4b002zld04xkn87tms",
    "name": "Éclair",
    "slug": "eclair",
    "price": 2.5,
    "priceFormatted": "2,50 €",
    "description": "Nadýchané cesto plnené jemným krémom, preliate čokoládovou polevou alebo lahodným krémom. Ikonický dezert, ktorý sa vždy postará o sladký zážitok.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Odpaľované & Choux",
    "image": "/images/products/eclair.webp",
    "images": [
      "/images/products/eclair.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgaknrtk0004lb049vgqpv63",
    "name": "Craquelin",
    "slug": "craquelin",
    "price": 2.5,
    "priceFormatted": "2,50 €",
    "description": "Francúzske tajomstvo dokonalého dezertu s chrumkavou krustou, jemným krémom a ovocím.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Odpaľované & Choux",
    "image": "/images/products/craquelin.webp",
    "images": [
      "/images/products/craquelin.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgaopfs7000yl204c842bck7",
    "name": "Opitý izidor",
    "slug": "opity-izidor",
    "price": 2.5,
    "priceFormatted": "2,50 €",
    "description": "Jemné orechové cesto, lahodný krém a výrazná rumová chuť a to všetko ukryté pod vrstvou čokoládovej polevy.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tradičné rezy & Klasika",
    "image": "/images/products/opity-izidor.webp",
    "images": [
      "/images/products/opity-izidor.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgaorw780007jp04czxdhc96",
    "name": "Medový krémeš",
    "slug": "medovy-kremes",
    "price": 2.5,
    "priceFormatted": "2,50 €",
    "description": "Nadýchaný dezert s jemným vanilkovým pudingom, šľahačkou a ľahkou medovou chuťou.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tradičné rezy & Klasika",
    "image": "/images/products/medovy-kremes.webp",
    "images": [
      "/images/products/medovy-kremes.webp",
      "/images/products/medovy-kremes-2.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  },
  {
    "id": "cmgaozyqh000bkz04fd80ju1y",
    "name": "Panacotta",
    "slug": "panacotta",
    "price": 2.5,
    "priceFormatted": "2,50 €",
    "description": "Jemný taliansky dezert zo smotany, podávaný s ovocným coulis.\n\nAby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je 5 kusov z jedného druhu.",
    "category": "zakusky",
    "subcategory": "Tartaletky & Mini dezerty",
    "image": "/images/products/panacotta.webp",
    "images": [
      "/images/products/panacotta.webp",
      "/images/products/panacotta-2.webp"
    ],
    "minQuantity": 5,
    "servings": "min. 5 ks z druhu"
  }
];
