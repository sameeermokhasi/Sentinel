import json
import os
import re

RAW_CATALOG_PATH = os.path.join(os.path.dirname(__file__), "raw_catalog.json")
CONVERTED_CATALOG_PATH = os.path.join(os.path.dirname(__file__), "converted_catalog.json")


def parse_price(raw_price):
    """
    Normalizes raw price input into a float/int number field.
    Returns None if unparseable.
    """
    if raw_price is None:
        return None

    if isinstance(raw_price, (int, float)):
        return float(raw_price)

    if isinstance(raw_price, str):
        # Clean price text like 'Rs. 1200/-', 'INR 4500', '3200 INR', '1599/-'
        cleaned = raw_price.strip()
        # Look for numbers inside the string
        match = re.search(r'[\d,]+(?:\.\d+)?', cleaned)
        if match:
            num_str = match.group(0).replace(',', '')
            try:
                return float(num_str)
            except ValueError:
                return None
    return None


def extract_size_from_text(text):
    if not text or not isinstance(text, str):
        return None
    match = re.search(r'\bsize\s+([A-Za-z0-9]+)\b', text, re.IGNORECASE)
    if match:
        val = match.group(1)
        if val.isdigit():
            return int(val)
        return val.upper()
    return None


def extract_color_from_text(text):
    if not text or not isinstance(text, str):
        return None
    colors = ["black", "white", "blue", "red", "grey", "gray", "brown", "green", "navy", "olive", "yellow", "pink"]
    for c in colors:
        if re.search(r'\b' + c + r'\b', text, re.IGNORECASE):
            return c.capitalize()
    return None


def parse_stock(stock_qty):
    if stock_qty is None:
        return None
    if isinstance(stock_qty, int):
        return stock_qty
    if isinstance(stock_qty, str):
        if stock_qty.isdigit():
            return int(stock_qty)
        if "in stock" in stock_qty.lower():
            return 10
    return None


def convert_catalog():
    """
    Loads raw_catalog.json, converts into structured converted_catalog.json format.
    """
    if not os.path.exists(RAW_CATALOG_PATH):
        raise FileNotFoundError(f"Raw catalog not found at {RAW_CATALOG_PATH}")

    with open(RAW_CATALOG_PATH, "r", encoding="utf-8") as f:
        raw_items = json.load(f)

    converted_items = []

    for item in raw_items:
        raw_id = item.get("raw_id")
        raw_title = item.get("item_title", "Unknown Item")
        details = item.get("details", "")

        # Standardize name
        clean_name = " ".join(raw_title.strip().split()).title()

        # Parse price
        price = parse_price(item.get("raw_price"))

        # Extract size
        size = item.get("size")
        if size is not None and isinstance(size, str) and size.isdigit():
            size = int(size)
        if size is None:
            size = extract_size_from_text(details)

        # Extract color
        color = item.get("color")
        if color is None:
            color = extract_color_from_text(raw_title) or extract_color_from_text(details)

        # Stock
        stock = parse_stock(item.get("stock_qty"))

        # Category
        category = (item.get("category") or "General").capitalize()

        needs_review = False
        review_reasons = []

        if price is None:
            needs_review = True
            review_reasons.append("price_unparseable")

        if size is None:
            needs_review = True
            review_reasons.append("size_missing")

        if stock is None:
            needs_review = True
            review_reasons.append("stock_missing")

        converted_item = {
            "product_id": raw_id,
            "name": clean_name,
            "price": price,
            "category": category,
            "size": size,
            "color": color,
            "stock": stock,
            "description": details,
            "needs_review": needs_review,
            "review_reasons": review_reasons,
            "original_raw": item
        }
        converted_items.append(converted_item)

    with open(CONVERTED_CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(converted_items, f, indent=2)

    return converted_items


def get_converted_catalog():
    """
    Returns current converted catalog list.
    """
    if not os.path.exists(CONVERTED_CATALOG_PATH) or os.path.getsize(CONVERTED_CATALOG_PATH) == 0:
        return convert_catalog()

    with open(CONVERTED_CATALOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def query_catalog(filters: dict) -> list:
    """
    Searches converted catalog by attributes: max_price, size, color, keyword.
    """
    catalog = get_converted_catalog()
    results = []

    max_price = filters.get("max_price")
    min_price = filters.get("min_price")
    requested_size = filters.get("size")
    requested_color = filters.get("color")
    keyword = filters.get("keyword")

    for item in catalog:
        # Price check
        if max_price is not None and item.get("price") is not None:
            if item["price"] > float(max_price):
                continue
        if min_price is not None and item.get("price") is not None:
            if item["price"] < float(min_price):
                continue

        # Size check
        if requested_size is not None:
            item_size = item.get("size")
            if item_size is not None:
                if str(item_size).strip().upper() != str(requested_size).strip().upper():
                    continue

        # Color check
        if requested_color is not None:
            item_color = item.get("color")
            if item_color is not None:
                if str(requested_color).strip().lower() not in str(item_color).strip().lower():
                    continue

        # Keyword check
        if keyword:
            kw = str(keyword).strip().lower()
            name_match = kw in item.get("name", "").lower()
            desc_match = kw in item.get("description", "").lower()
            cat_match = kw in item.get("category", "").lower()
            if not (name_match or desc_match or cat_match):
                continue

        results.append(item)

    return results


def update_catalog_entry(product_id: str, updates: dict) -> dict:
    """
    Patches a specific product's fields in converted_catalog.json.
    """
    catalog = get_converted_catalog()
    target_item = None

    for item in catalog:
        if item.get("product_id") == product_id:
            target_item = item
            break

    if not target_item:
        raise ValueError(f"Product ID {product_id} not found in catalog.")

    # Apply updates
    for key, value in updates.items():
        if key != "product_id":
            target_item[key] = value

    # Re-evaluate needs_review status
    review_reasons = []
    if target_item.get("price") is None:
        review_reasons.append("price_unparseable")
    if target_item.get("size") is None:
        review_reasons.append("size_missing")
    if target_item.get("stock") is None:
        review_reasons.append("stock_missing")
    if target_item.get("flagged_duplicate"):
        review_reasons.append("flagged_duplicate")

    # If explicitly review cleared or resolved by healer
    if updates.get("needs_review") is False:
        target_item["needs_review"] = False
        target_item["review_reasons"] = [r for r in review_reasons if r not in updates.get("resolved_reasons", [])]
    else:
        target_item["needs_review"] = len(review_reasons) > 0
        target_item["review_reasons"] = review_reasons

    with open(CONVERTED_CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)

    return target_item


if __name__ == "__main__":
    print("Running Catalog Converter...")
    converted = convert_catalog()
    review_needed_count = sum(1 for item in converted if item.get("needs_review"))
    print(f"Total products converted: {len(converted)}")
    print(f"Products needing review: {review_needed_count}")
