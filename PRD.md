# Product Requirement Document (PRD)

## Project Name: Sentinel
**Subtitle**: AI Agent Self-Healing Commerce & Catalog Platform  
**Repository**: [https://github.com/sameeermokhasi/Sentinel.git](https://github.com/sameeermokhasi/Sentinel.git)

---

## 1. Executive Summary
**Sentinel** is an enterprise-grade AI Multi-Agent Commerce Platform designed to solve catalog data decay, unparseable product attributes, and failed natural language search queries in e-commerce.

By combining **Groq Llama 3.1 LLM natural language understanding**, **autonomous AI data healing**, **Scikit-Learn Isolation Forest statistical anomaly detection**, **Razorpay payments**, and a **Next.js 16 Three.js 3D WebGL dashboard**, Sentinel transforms messy catalog datasets into reliable, self-correcting commerce workflows.

---

## 2. Problem Statement
E-commerce catalogs frequently suffer from data quality degradation:
* **Unparseable Prices**: Text strings like `"Rs. 2499/-"`, `"INR 1800"`, or `"Price on Request"`.
* **Missing Attributes**: Missing sizes, colors, or categories buried inside product description paragraphs.
* **Failed Buyer Searches**: Traditional keyword search engines fail when buyers use natural language queries (e.g. *"find red speed runner shoes under 3000 in size 8"*).
* **Silent Drop-offs**: Failed searches lead to dead ends without notifying catalog administrators.

---

## 3. Core Objectives & Scope

### Primary Objectives
1. **Natural Language Shopping**: Convert plain-language buyer prompts into structured JSON filters (`max_price`, `min_price`, `size`, `color`, `category`, `keywords`) using Groq Llama 3.1.
2. **Automated Order Generation**: Create official test orders via the **Razorpay SDK** (`order_test_...`) upon successful catalog matching.
3. **Autonomous Data Healing**: Automatically intercept failed searches caused by catalog defects, patch unparseable prices or missing attributes, and re-index the catalog.
4. **Machine Learning Anomaly Detection**: Identify statistical price and size outliers across 1,000+ products using `IsolationForest`.
5. **Interactive 3D WebGL Experience**: Render 360-degree rotating 3D product showcases using Three.js inside a Next.js 16 dashboard.

---

## 4. Key Functional Features

### Feature A: Buyer Agent Engine (`agent/buyer_agent.py`)
* Accepts natural language shopping queries.
* Calls **Groq API (`llama-3.1-8b-instant`)** with structured JSON output constraints.
* Includes fallback rule-based regex intent parser for zero-downtime resilience.
* Filters catalog items by price, size, color, category, and keyword fuzzy matching.
* Triggers Razorpay order creation on successful match.

### Feature B: Failure Logger & Catalog Healer (`healer/catalog_healer.py`)
* Logs all failed queries into `failure_logs.json` with parsed filters and candidate product IDs.
* **Fixable Classification**: If a failure points to a catalog defect (e.g. `"Price on Request"`), patches `converted_catalog.json` and updates status to `"resolved"`.
* **Unfixable Classification**: If no candidate product exists, marks status to `"no_match_unfixable"` with clear rationale.

### Feature C: Isolation Forest Anomaly Detector (`healer/anomaly_model.py`)
* Trains a `sklearn.ensemble.IsolationForest` model on numeric catalog features (price, size, stock quantity).
* Automatically flags statistical outliers (e.g. corrupted price `₹99,999` or negative stock).

### Feature D: Audit Trail Engine (`audit/audit_trail.py`)
* Records an immutable log of all buyer queries, agent decisions, payment orders, and healer resolutions to `audit_trail.json` with ISO-8601 timestamps.

### Feature E: Next.js 16 WebGL 3D Dashboard (`frontend/`)
* **Buyer Console**: Search box, live execution steps, order confirmation cards, and 3D rotating WebGL showcase.
* **Catalog Healer Hub**: Trigger AI healing pass and run ML anomaly detection scans.
* **Live Catalog Grid**: Browse 1,000+ items with category filtering and 3D visuals.
* **Failure Log & Audit Replay**: Inspect structured failure records and replay agent decision trajectories.

---

## 5. Data Schemas

### Raw Catalog Schema (`catalog/raw_catalog.json`)
```json
{
  "raw_id": "RAW-0004",
  "item_title": "PUMA SPEED RUNNER RED",
  "raw_price": 2890.0,
  "category": "footwear",
  "size": 8,
  "color": "Red",
  "stock_qty": 12,
  "details": "Lightweight speed runner."
}
```

### Converted Catalog Schema (`catalog/converted_catalog.json`)
```json
{
  "id": "RAW-0004",
  "name": "Puma Speed Runner Red",
  "price": 2890.0,
  "currency": "INR",
  "category": "footwear",
  "size": 8,
  "color": "Red",
  "stock_qty": 12,
  "needs_review": false,
  "description": "Lightweight speed runner."
}
```

---

## 6. Non-Functional Requirements
* **Response Latency**: End-to-end `/shop` API execution < 1.5 seconds.
* **Scalability**: Tested and validated on 1,000+ catalog items.
* **Resilience**: Groq API timeout fallback to rule parser ensures 100% uptime.
* **Security**: Environment variables isolated via `.env` file (`.gitignore` enforced).
