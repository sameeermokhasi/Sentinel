import json
import os
import sys
import requests

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agent.buyer_agent import process_buyer_request
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

FALLBACK_ADVERSARIAL_QUERIES = [
    "find Jack & Jones Graphic Tee White under 3000 in size M",  # Unparseable price "Price on Request"
    "find PUMA SPEED RUNNER RED under 2890 in size 8",            # Boundary-edge price
    "find Nike Running Shoes Mens in size XX-LARGE",             # Malformed size request
    "find Levi's Slim Fit Jeans Blue under 1500",                # Data defect query
    "find Puma Speed Runner - Special Edition in red",           # Near-duplicate name
    "find Adidas Ultraboost Sneaker Black under 2000 in size 10",# Price boundary test
    "find Van Heusen Formal Shirt White in size 42",             # Size formatting edge case
    "find Superdry Puffer Jacket Red under 4000",                # High price query
    "find Woodland Leather Boots Brown in size 9",              # Category specific query
    "find Red Tape Casual Sneakers White under 1000 in size 7"   # Low boundary price query
]


def generate_adversarial_queries() -> list[str]:
    """
    Uses Groq LLM to generate 10 deliberately tricky shopping queries designed to expose catalog weaknesses.
    Falls back to a curated set of 10 adversarial queries if API is unavailable.
    """
    if not GROQ_API_KEY:
        print("[AdversaryAgent] GROQ_API_KEY not found. Using fallback adversarial queries.")
        return FALLBACK_ADVERSARIAL_QUERIES

    prompt = """
    You are an AI Adversary QA Agent testing an e-commerce catalog search engine.
    Generate exactly 10 deliberately tricky, adversarial buyer search queries designed to expose catalog weaknesses.
    Include a mix of:
    1. Ambiguous near-duplicate product names (e.g. "Puma Speed Runner - Special Edition")
    2. Boundary-edge prices (e.g. searching exactly at a product's minimum price)
    3. Malformed size requests (e.g. "size XX-LARGE" or "size 9.5")
    4. Queries targeting products with unparseable text prices like "Price on Request" or "Rs. 2499/-".

    Return ONLY a valid JSON array of 10 string queries, nothing else.
    Example: ["query 1", "query 2", ...]
    """

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": "You are a QA automation agent. Output ONLY valid JSON arrays."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.4
    }

    try:
        res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=8)
        if res.status_code == 200:
            content = res.json()["choices"][0]["message"]["content"].strip()
            # Extract JSON array
            if "[" in content and "]" in content:
                start = content.find("[")
                end = content.rfind("]") + 1
                queries = json.loads(content[start:end])
                if isinstance(queries, list) and len(queries) >= 5:
                    return queries[:10]
    except Exception as e:
        print(f"[AdversaryAgent] LLM generation failed: {e}. Using fallback queries.")

    return FALLBACK_ADVERSARIAL_QUERIES


def run_adversarial_suite(queries: list[str] = None) -> dict:
    """
    Runs each query against process_buyer_request directly (no HTTP calls).
    Records succeeded vs failed queries with details.
    """
    if not queries:
        queries = generate_adversarial_queries()

    succeeded = 0
    failed = 0
    details = []

    for q in queries:
        result = process_buyer_request(q)
        is_success = result.get("status") == "success"
        if is_success:
            succeeded += 1
            details.append({
                "query": q,
                "status": "success",
                "matched_product": result.get("product", {}).get("name"),
                "order_id": result.get("order", {}).get("order_id")
            })
        else:
            failed += 1
            details.append({
                "query": q,
                "status": "failure",
                "reason": result.get("message", "No matching product found"),
                "filters": result.get("filters", {})
            })

    return {
        "total": len(queries),
        "succeeded": succeeded,
        "failed": failed,
        "details": details
    }


if __name__ == "__main__":
    report = run_adversarial_suite()
    print(json.dumps(report, indent=2))
