import os
import sys
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sklearn.ensemble import IsolationForest
from catalog.catalog_manager import get_converted_catalog, update_catalog_entry
from audit.audit_trail import log_action



def run_anomaly_scan() -> dict:
    """
    Fits a scikit-learn IsolationForest model on numeric features of the converted catalog:
    - price
    - stock count
    - description length
    - name length

    Flags statistical outliers as 'needs_review': true with reason 'statistical_outlier'.
    """
    catalog = get_converted_catalog()
    if not catalog or len(catalog) < 5:
        return {"scanned": len(catalog), "outliers_detected": 0, "flagged_ids": []}

    # Extract feature matrix X
    features = []
    product_ids = []

    # Calculate medians for missing value imputation
    valid_prices = [item["price"] for item in catalog if item.get("price") is not None]
    median_price = float(np.median(valid_prices)) if valid_prices else 2000.0

    valid_stocks = [item["stock"] for item in catalog if item.get("stock") is not None]
    median_stock = float(np.median(valid_stocks)) if valid_stocks else 10.0

    for item in catalog:
        product_ids.append(item.get("product_id"))
        p = float(item.get("price")) if item.get("price") is not None else median_price
        s = float(item.get("stock")) if item.get("stock") is not None else median_stock
        d_len = float(len(item.get("description", "")))
        n_len = float(len(item.get("name", "")))
        features.append([p, s, d_len, n_len])

    X = np.array(features)

    # Train Isolation Forest
    model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    predictions = model.fit_predict(X)  # 1 for inliers, -1 for outliers

    outlier_ids = []
    for idx, pred in enumerate(predictions):
        if pred == -1:
            pid = product_ids[idx]
            outlier_ids.append(pid)
            item = catalog[idx]

            existing_reasons = item.get("review_reasons", [])
            if "statistical_outlier" not in existing_reasons:
                existing_reasons.append("statistical_outlier")

            update_catalog_entry(pid, {
                "needs_review": True,
                "review_reasons": existing_reasons,
                "flagged_outlier": True
            })

    log_action(
        agent_name="AnomalyModel",
        action="run_anomaly_scan",
        reasoning=f"Ran IsolationForest outlier detection over {len(catalog)} products",
        result="success",
        details={"scanned": len(catalog), "outliers_detected": len(outlier_ids), "outlier_ids": outlier_ids}
    )

    return {
        "scanned": len(catalog),
        "outliers_detected": len(outlier_ids),
        "outlier_ids": outlier_ids
    }
