# Sentinel — System Rules & Architecture Constraints

This document defines the strict development rules, failure classification logic, catalog normalization guidelines, and security policies governing the **Sentinel** codebase.

---

## 1. Catalog Data Normalization Rules

1. **Price Normalization Rule**:
   * If `raw_price` is a numeric `float` or `int` $\rightarrow$ set `price = raw_price`, `needs_review = False`.
   * If `raw_price` is a string matching regex `r"^(?:Rs\.?|INR)?\s*(\d+(?:\.\d+)?)\s*/?-$"` $\rightarrow$ extract numeric value, set `needs_review = True`.
   * If `raw_price` is unparseable (e.g. `"Price on Request"`, `"Contact Dealer"`) $\rightarrow$ set `price = None`, `needs_review = True`.

2. **Size Normalization Rule**:
   * If explicit `size` field exists $\rightarrow$ cast to `int` for footwear or string (`"M"`, `"L"`) for apparel.
   * If `size` field is missing $\rightarrow$ inspect `details` text via regex `r"size\s+([A-Z0-9]+)"`.
   * If unresolvable $\rightarrow$ set `size = None`, `needs_review = True`.

3. **Stock Normalization Rule**:
   * String `"In Stock"` $\rightarrow$ default to `stock_qty = 10`.
   * Null or missing stock $\rightarrow$ default to `stock_qty = 0`.

---

## 2. Failure Classification Rules

When the Buyer Agent logs a search failure, the **Catalog Healer (`healer/catalog_healer.py`)** MUST follow strict classification criteria:

### Category 1: Fixable Data Defect (`status: "resolved"`)
* **Condition**: A failure record contains a valid `catalog_entry_id` (e.g., `RAW-0026`).
* **Reason**: The product exists in the catalog, but the failure occurred due to format errors (e.g. price `"Price on Request"`, missing size, ambiguous name).
* **Action**:
  1. Patch the catalog entry in `converted_catalog.json` with resolved numeric price or size.
  2. Set `needs_review = False`.
  3. Mark failure record `status = "resolved"`.
  4. Write `resolution_notes` detailing what exact fields were repaired.

### Category 2: Unfixable Query (`status: "no_match_unfixable"`)
* **Condition**: A failure record has NO `catalog_entry_id` (i.e. `catalog_entry_id is None`).
* **Reason**: No candidate product exists in the catalog that could satisfy the buyer's query (e.g. searching for products not stocked).
* **Action**:
  1. Mark failure record `status = "no_match_unfixable"`.
  2. DO NOT mark status as `"resolved"`.
  3. Write `resolution_notes` explaining that no catalog product satisfies this query.

---

## 3. Machine Learning Anomaly Detection Rules

1. **Isolation Forest Model Configuration**:
   * Model: `sklearn.ensemble.IsolationForest(contamination=0.1, random_state=42)`
   * Features: `[price, size_numeric, stock_qty]`
2. **Execution Boundary**:
   * Must handle `NaN` values via imputation (median replacement) before fitting matrix.
   * Outliers identified with `prediction == -1`.

---

## 4. Codebase & Import Path Rules

1. **Module Path Resolution**:
   * Every runnable Python module in `agent/`, `healer/`, `catalog/`, and `backend/` MUST include path insertion at the top:
     ```python
     import sys, os
     sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
     ```
2. **Environment & Secrets Safety**:
   * API keys (`GROQ_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) MUST be loaded exclusively from `.env` using `python-dotenv`.
   * `.env` file MUST remain listed in `.gitignore` and NEVER committed to version control.

---

## 5. UI & 3D WebGL Rendering Rules

1. **100% 3D Frame Requirement**:
   * Product cards across the dashboard MUST render inside the **Three.js WebGL `<Canvas>`** (`ProductVisual`).
   * 2D static image frames or plain placeholder icons are disallowed.
2. **Studio Turntable Stage**:
   * 3D product showcase panels MUST be mounted on a rotating dark turntable stage (`#121214`) with gold metallic trim (`#c9a15a`), contact shadows, and 360-degree Y-axis rotation.
