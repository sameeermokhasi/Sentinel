import json
import os
import sys
import re

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
from catalog.catalog_manager import query_catalog
from healer.failure_logger import log_failure
from payments.razorpay_client import create_order
from audit.audit_trail import log_action
from agent.prompts import FILTER_EXTRACTION_PROMPT


load_dotenv()

# Try initializing Groq client
try:
    import groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


def extract_filters_with_llm(user_request: str) -> dict:
    """
    Uses Groq API (llama-3.1-8b-instant) to parse user query into structured filters.
    Falls back to regex rule engine if GROQ_API_KEY is not set or request fails.
    """
    api_key = os.getenv("GROQ_API_KEY")

    if GROQ_AVAILABLE and api_key and api_key.startswith("gsk_"):
        try:
            client = groq.Groq(api_key=api_key)
            prompt = FILTER_EXTRACTION_PROMPT.format(user_request=user_request)
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            content = response.choices[0].message.content.strip()
            # Extract JSON substring if wrapped in markdown code blocks
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
        except Exception as e:
            pass

    # Rule-based fallback parser
    return extract_filters_rule_based(user_request)


def extract_filters_rule_based(text: str) -> dict:
    """
    Fallback deterministic regex parser for shopping query.
    """
    filters = {
        "max_price": None,
        "min_price": None,
        "size": None,
        "color": None,
        "keyword": None
    }

    # Max price: 'under 3000', 'below 2500', 'less than 5000', 'under rs 3000'
    max_p = re.search(r'(?:under|below|less than|max)\s+(?:rs\.?|inr)?\s*(\d+)', text, re.IGNORECASE)
    if max_p:
        filters["max_price"] = float(max_p.group(1))

    # Size: 'size 9', 'size 10', 'size XL', 'size M', 'size 40'
    sz = re.search(r'\bsize\s+([A-Za-z0-9]+)\b', text, re.IGNORECASE)
    if sz:
        val = sz.group(1)
        filters["size"] = int(val) if val.isdigit() else val.upper()

    # Color
    colors = ["black", "white", "blue", "red", "grey", "gray", "brown", "green", "navy", "olive"]
    for c in colors:
        if re.search(r'\b' + c + r'\b', text, re.IGNORECASE):
            filters["color"] = c
            break

    # Keyword extraction (remove price/size words)
    kw_text = text
    if max_p:
        kw_text = kw_text.replace(max_p.group(0), "")
    if sz:
        kw_text = kw_text.replace(sz.group(0), "")
    for c in colors:
        kw_text = re.sub(r'\b' + c + r'\b', '', kw_text, flags=i if 'i' in locals() else re.IGNORECASE)

    # Clean words
    cleaned_words = [w for w in kw_text.split() if w.lower() not in ["find", "looking", "for", "shoes", "shoe", "under", "in", "with", "a", "an", "the", "rs", "inr"]]
    if cleaned_words:
        filters["keyword"] = " ".join(cleaned_words)
    elif "running" in text.lower():
        filters["keyword"] = "running"

    return filters


def process_shopping_request(query: str) -> dict:
    """
    Main Buyer Agent workflow:
    1. Parse NL request into filters using Groq LLM / fallback parser
    2. Query converted catalog
    3. Evaluate candidates & create order or log structured failure
    """
    # Step 1: Parse query
    filters = extract_filters_with_llm(query)
    log_action("BuyerAgent", "extract_filters", f"Parsed query '{query}' into filters", "success", details={"filters": filters})

    # Step 2: Query catalog
    matches = query_catalog(filters)
    log_action("BuyerAgent", "query_catalog", f"Queried catalog with filters", "success", details={"match_count": len(matches), "filters": filters})

    if not matches:
        # Failure: No products match filter
        fail_record = log_failure(
            query=query,
            reason="No products found matching criteria",
            missing_field="product",
            catalog_entry_id=None,
            details={"filters": filters}
        )
        log_action("BuyerAgent", "match_failed", "No products matched query filters", "failed", details={"failure_id": fail_record["failure_id"]})

        return {
            "status": "failure",
            "message": "No products found matching your request.",
            "filters": filters,
            "failure_record": fail_record
        }

    # Step 3: Select top candidate
    best_candidate = matches[0]

    # Check if candidate needs review or has missing attributes
    if best_candidate.get("needs_review"):
        reasons = best_candidate.get("review_reasons", [])
        primary_reason = reasons[0] if reasons else "data_quality_issue"

        fail_record = log_failure(
            query=query,
            reason=f"Candidate product {best_candidate['product_id']} has incomplete or ambiguous data ({', '.join(reasons)})",
            missing_field=primary_reason,
            catalog_entry_id=best_candidate["product_id"],
            details={"candidate": best_candidate, "filters": filters}
        )
        log_action("BuyerAgent", "match_flagged_for_review", f"Candidate {best_candidate['product_id']} requires review ({primary_reason})", "failed", details={"failure_id": fail_record["failure_id"]})

        return {
            "status": "failure",
            "message": f"Found candidate '{best_candidate['name']}' but its data needs review ({', '.join(reasons)}). Failure logged for healing.",
            "candidate": best_candidate,
            "failure_record": fail_record
        }

    # Validate essential price field
    price = best_candidate.get("price")
    if price is None or price <= 0:
        fail_record = log_failure(
            query=query,
            reason=f"Product {best_candidate['product_id']} has invalid or unparseable price",
            missing_field="price",
            catalog_entry_id=best_candidate["product_id"],
            details={"candidate": best_candidate}
        )
        log_action("BuyerAgent", "match_invalid_price", f"Product price invalid for {best_candidate['product_id']}", "failed", details={"failure_id": fail_record["failure_id"]})

        return {
            "status": "failure",
            "message": "Matched product has invalid price. Failure logged for healing.",
            "failure_record": fail_record
        }

    # Success match! Create Razorpay order
    payment_order = create_order(
        amount=price,
        currency="INR",
        receipt_id=f"order_{best_candidate['product_id']}"
    )

    log_action(
        agent_name="BuyerAgent",
        action="create_order",
        reasoning=f"Found confident product match '{best_candidate['name']}' (ID: {best_candidate['product_id']}) at price INR {price}.",
        result="success",
        details={
            "product_id": best_candidate["product_id"],
            "product_name": best_candidate["name"],
            "price": price,
            "order_id": payment_order.get("order_id"),
            "payment_details": payment_order
        }
    )

    return {
        "status": "success",
        "message": f"Successfully matched product and created Razorpay order!",
        "product": best_candidate,
        "order": payment_order,
        "filters_applied": filters
    }
