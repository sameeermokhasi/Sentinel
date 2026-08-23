import json
import os
import random
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from catalog.catalog_manager import convert_catalog

RAW_CATALOG_PATH = os.path.join(os.path.dirname(__file__), "raw_catalog.json")

# Authentic brand names and category templates
BRANDS = {
    "footwear": ["Puma", "Nike", "Adidas", "Reebok", "Under Armour", "Asics", "Woodland", "Bata", "Sparx", "Campus", "Red Tape", "Wildcraft", "Skechers"],
    "apparel": ["Levi's", "Superdry", "Jack & Jones", "Van Heusen", "Allen Solly", "Peter England", "HRX", "US Polo Assn", "Tommy Hilfiger", "Zara", "Roadster", "Wrangler"]
}

FOOTWEAR_ITEMS = ["Running Shoes", "Trail Boots", "Casual Sneakers", "Walking Shoes", "Basketball Shoes", "Formal Leather Shoes", "Canvas Sneakers", "Training Shoes", "Loafers"]
APPAREL_ITEMS = ["Slim Fit Jeans", "Dri-Fit T-Shirt", "Graphic Tee", "Puffer Jacket", "Polo Shirt", "Formal Shirt", "Track Pants", "Gym Shorts", "Fleece Hoodie", "Denim Jacket"]

COLORS = ["Red", "Blue", "Black", "White", "Grey", "Brown", "Green", "Navy", "Olive"]
SHOE_SIZES = [6, 7, 8, 9, 10, 11, 12]
CLOTH_SIZES = ["S", "M", "L", "XL", "XXL", "30", "32", "34", "38", "40"]


def generate_bulk_catalog(total_items: int = 1000, messy_ratio: float = 0.15):
    """
    Generates 1000 products based on raw_catalog templates with ~15% controlled messiness.
    """
    random.seed(42)  # Deterministic realistic generation
    products = []

    # Preserve essential anchor demo items (Puma Speed Runner Red, etc.)
    anchor_items = [
        {
            "raw_id": "RAW-0001",
            "item_title": "PUMA SPEED RUNNER RED",
            "raw_price": 2890.0,
            "size": 8,
            "color": "Red",
            "stock_qty": 12,
            "category": "footwear",
            "details": "Lightweight speed runner."
        },
        {
            "raw_id": "RAW-0002",
            "item_title": "Jack & Jones Graphic Tee White",
            "raw_price": "Price on Request",
            "size": "M",
            "color": "White",
            "stock_qty": 15,
            "category": "apparel",
            "details": "Printed casual cotton t-shirt."
        }
    ]
    products.extend(anchor_items)

    for i in range(len(anchor_items) + 1, total_items + 1):
        raw_id = f"RAW-{i:04d}"
        is_footwear = (i % 2 == 1)
        category = "footwear" if is_footwear else "apparel"
        brand = random.choice(BRANDS[category])
        item_type = random.choice(FOOTWEAR_ITEMS if is_footwear else APPAREL_ITEMS)
        color = random.choice(COLORS)
        size = random.choice(SHOE_SIZES if is_footwear else CLOTH_SIZES)

        # Decide if this entry gets injected messiness (~15% of catalog)
        is_messy = (random.random() < messy_ratio)

        # Title construction
        title_base = f"{brand} {item_type} {color}"
        if is_messy and random.random() < 0.3:
            # Duplicate / variant formatting
            item_title = f"{title_base} - Special Edition"
        elif random.random() < 0.2:
            item_title = title_base.upper()
        elif random.random() < 0.2:
            item_title = title_base.lower()
        else:
            item_title = title_base.title()

        # Base clean price
        price_val = float(random.randint(599, 8999))

        if is_messy:
            messy_type = random.choice(["text_price", "unparseable_price", "missing_size"])
            if messy_type == "text_price":
                raw_price = f"Rs. {int(price_val)}/-"
            elif messy_type == "unparseable_price":
                raw_price = random.choice(["Price on Request", "FREE TRIAL", "Contact Dealer"])
            else:
                raw_price = price_val
                size = None  # Size missing in main field
        else:
            # Clean price formats (85%)
            if random.random() < 0.7:
                raw_price = price_val
            else:
                raw_price = f"INR {int(price_val)}"

        # Details description
        desc_size_part = f"size {size} " if size is not None else "available in standard sizes "
        details = f"High quality {brand} {item_type} {desc_size_part}in {color.lower()} color for everyday style."

        entry = {
            "raw_id": raw_id,
            "item_title": item_title,
            "raw_price": raw_price,
            "category": category,
            "details": details
        }

        if size is not None:
            entry["size"] = size
        if color:
            entry["color"] = color
        if not (is_messy and random.random() < 0.5):
            entry["stock_qty"] = random.randint(1, 40)

        products.append(entry)

    # Save to raw_catalog.json
    with open(RAW_CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2)

    print(f"Generated {len(products)} total products in raw_catalog.json (~15% controlled messiness).")

    # Run catalog converter to update converted_catalog.json
    converted = convert_catalog()
    review_needed_count = sum(1 for item in converted if item.get("needs_review"))

    print(f"Catalog conversion completed:")
    print(f"  - Converted items: {len(converted)}")
    print(f"  - Flagged for review: {review_needed_count} ({review_needed_count / len(converted) * 100:.1f}%)")

    return products


if __name__ == "__main__":
    generate_bulk_catalog(1000, 0.15)
