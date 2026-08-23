import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from catalog.catalog_manager import get_converted_catalog
from healer.failure_logger import get_all_failures
from healer.anomaly_model import run_anomaly_scan

HISTORY_FILE = os.path.join(os.path.dirname(__file__), "readiness_history.json")


def calculate_readiness_score() -> dict:
    """
    Computes a 0-100 Catalog AI-Readiness Score based on:
    1. % of products in converted_catalog.json without needs_review flag (weight 40%)
    2. % of entries in failure_logs.json with status 'resolved' (weight 30%)
    3. (1 - outlier_ratio) from anomaly detection scan in anomaly_model.py (weight 30%)
    """

    # 1. Cleanliness Component (40%)
    catalog = get_converted_catalog()
    total_products = len(catalog)
    if total_products > 0:
        clean_products = sum(1 for item in catalog if not item.get("needs_review"))
        cleanliness_ratio = clean_products / total_products
    else:
        cleanliness_ratio = 1.0

    cleanliness_score = cleanliness_ratio * 100.0

    # 2. Healing Efficiency Component (30%)
    failures = get_all_failures()
    total_failures = len(failures)
    if total_failures > 0:
        resolved_count = sum(1 for f in failures if f.get("status") == "resolved")
        unfixable_count = sum(1 for f in failures if f.get("status") == "no_match_unfixable")
        processed_count = resolved_count + unfixable_count
        if processed_count > 0:
            healing_ratio = resolved_count / processed_count
        else:
            healing_ratio = 1.0
    else:
        healing_ratio = 1.0

    healing_score = healing_ratio * 100.0

    # 3. Model Anomaly Fitness Component (30%)
    anomaly_result = run_anomaly_scan()
    scanned = anomaly_result.get("scanned", 0)
    outliers = anomaly_result.get("outliers_detected", 0)

    if scanned > 0:
        outlier_ratio = outliers / scanned
        fitness_ratio = max(0.0, 1.0 - outlier_ratio)
    else:
        fitness_ratio = 1.0

    fitness_score = fitness_ratio * 100.0

    # Weighted Score Combination
    total_score = round(
        (cleanliness_score * 0.40) +
        (healing_score * 0.30) +
        (fitness_score * 0.30),
        1
    )

    breakdown = {
        "cleanliness_score": round(cleanliness_score, 1),
        "clean_products": clean_products if total_products > 0 else 0,
        "total_products": total_products,
        "healing_score": round(healing_score, 1),
        "resolved_failures": resolved_count if total_failures > 0 else 0,
        "total_failures": total_failures,
        "fitness_score": round(fitness_score, 1),
        "outliers_detected": outliers,
        "scanned_products": scanned
    }

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "score": total_score,
        "breakdown": breakdown
    }

    # Append to readiness_history.json
    history = get_readiness_history()
    history.append(entry)

    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        print(f"[ReadinessScore] Failed to write history file: {e}")

    return {
        "score": total_score,
        "breakdown": breakdown,
        "timestamp": entry["timestamp"]
    }


def get_readiness_history() -> list:
    """Returns the full list of entries from readiness_history.json."""
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


if __name__ == "__main__":
    score = calculate_readiness_score()
    print(json.dumps(score, indent=2))
