# Sentinel — System Architecture & Component Design

**Repository**: [https://github.com/sameeermokhasi/Sentinel.git](https://github.com/sameeermokhasi/Sentinel.git)  
**Branch**: `main`

---

## 1. System Architecture Diagram

```mermaid
graph TD
    User["🌐 Buyer / User"] -->|1. Natural Language Query| NextJS["Frontend (Next.js 16 + WebGL 3D)"]
    NextJS -->|2. POST /shop| FastAPI["FastAPI Backend (port 8005)"]
    
    subgraph Multi-Agent Engine
        FastAPI -->|3. Extract Filters| BuyerAgent["Buyer Agent (Groq Llama 3.1 LLM)"]
        BuyerAgent -->|4. Intent JSON| RuleParser["Fallback Regex Intent Parser"]
        BuyerAgent -->|5. Match Query| CatalogManager["Catalog Manager"]
        CatalogManager -->|6. Query Data| ConvertedCatalog[("converted_catalog.json\n(1,000 products)")]
    end
    
    subgraph Payment & Audit Subsystems
        BuyerAgent -->|7. Success Match| RazorpayClient["Razorpay SDK Client"]
        RazorpayClient -->|8. Create Order| RazorpayAPI[("Razorpay Test API")]
        BuyerAgent -->|9. Log Action| AuditTrail[("audit_trail.json")]
    end
    
    subgraph Autonomous Self-Healing Subsystem
        BuyerAgent -->|10. Log Defect Failure| FailureLogger[("failure_logs.json")]
        NextJS -->|11. POST /heal| CatalogHealer["AI Catalog Healer Agent"]
        CatalogHealer -->|12. Patch Price/Size| ConvertedCatalog
        CatalogHealer -->|13. Mark Status| FailureLogger
        CatalogHealer -->|14. Isolation Forest| AnomalyModel["ML Anomaly Detector"]
    end
```

---

## 2. Sequence Diagram (Shopping & Self-Healing Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant UI as Next.js Dashboard
    participant API as FastAPI Backend
    participant LLM as Groq Llama 3.1
    participant Cat as Converted Catalog
    participant Pay as Razorpay SDK
    participant Healer as AI Catalog Healer

    Buyer->>UI: Types "find red speed runner shoes under 3000 in size 8"
    UI->>API: POST /shop { query: "find red speed runner shoes..." }
    API->>LLM: Parse intent prompt
    LLM-->>API: Returns { max_price: 3000, color: "Red", size: 8, keyword: "speed runner" }
    API->>Cat: Query catalog matching filters
    Cat-->>API: Match found: "Puma Speed Runner Red" (₹2,890)
    API->>Pay: Create test order for ₹2,890
    Pay-->>API: Returns razorpay_order_id: "order_test_98e639ef3adf"
    API-->>UI: Returns product, order ID, and renders 3D WebGL showcase

    Note over Buyer, Healer: Scenario B: Catalog Data Defect / Search Failure
    Buyer->>UI: Types query with unparseable price
    API->>Cat: Match fails due to data defect ("Price on Request")
    API->>UI: Log failure record & return "No match"
    UI->>API: POST /heal (Trigger Healer Pass)
    API->>Healer: Inspect unresolved failure logs
    Healer->>Cat: Patch raw_price to numeric 2499.0 & set needs_review = False
    Healer-->>UI: Return healed status "resolved" & anomaly scan results
```

---

## 3. Directory & File Structure

```text
Sentinel/
├── .env                         # API credentials (GROQ_API_KEY, RAZORPAY keys)
├── .gitignore                   # Ignore .env, node_modules, .next, __pycache__
├── requirements.txt             # Python dependencies (fastapi, uvicorn, groq, razorpay, scikit-learn)
├── PRD.md                       # Product Requirement Document
├── rules.md                     # Business rules & normalization logic
├── architecture.md              # Architecture diagrams & folder structure
│
├── agent/                       # Multi-Agent Shopping Engine
│   ├── __init__.py
│   ├── buyer_agent.py           # Natural language query matching & Razorpay integration
│   └── prompts.py               # Groq LLM system prompts & filter extraction logic
│
├── backend/                     # RESTful API Service
│   ├── __init__.py
│   └── main.py                  # FastAPI server (/shop, /heal, /catalog, /failures, /audit)
│
├── catalog/                     # Catalog Data & Conversion Engine
│   ├── __init__.py
│   ├── raw_catalog.json         # Raw messy catalog (1,000 items)
│   ├── converted_catalog.json   # Clean converted catalog (1,000 items)
│   ├── catalog_manager.py       # Normalization parser (price, size, stock, needs_review)
│   ├── generate_large_catalog.py# 1,000 product generator
│   └── generate_bulk_catalog.py # Controlled messiness (~15%) bulk generator
│
├── healer/                      # AI Self-Healing & ML Outlier Detection
│   ├── __init__.py
│   ├── failure_logs.json        # Failure log storage
│   ├── failure_logger.py        # Failure logging & status management
│   ├── catalog_healer.py        # Fixable vs Unfixable resolution agent
│   └── anomaly_model.py         # IsolationForest statistical anomaly model
│
├── payments/                    # Payment Processing
│   ├── __init__.py
│   └── razorpay_client.py       # Razorpay order generation & verification
│
├── audit/                       # Decision Auditing & Replay
│   ├── __init__.py
│   ├── audit_trail.json         # Timestamped decision log storage
│   └── audit_trail.py           # Audit logging engine
│
└── frontend/                    # Next.js 16 Three.js 3D WebGL Dashboard
    ├── package.json             # Next.js, Three.js, React Three Fiber dependencies
    ├── next.config.mjs          # Next.js configuration
    ├── app/                     # Next.js App Router pages (/shop, /healer, /catalog, /failures, /audit)
    ├── components/              # UI Components
    │   ├── product-visual.tsx   # Three.js WebGL 3D Rotating Showcase Panel canvas
    │   ├── product-image.tsx    # 3D WebGL visual wrapper component
    │   ├── agent-console.tsx    # Buyer agent search console
    │   ├── catalog-grid.tsx     # Catalog item grid
    │   └── healer-console.tsx   # Healer triggers & anomaly scan UI
    ├── lib/                     # API client utilities
    │   ├── sentinel-api.ts      # Sentinel REST API client hooks
    │   └── api-base.ts          # API base URL configuration (http://localhost:8005)
    └── public/                  # Static assets & product images
        └── products/            # High-resolution Puma Speedcat product assets
```

---

## 4. API Specification Summary

| Method | Endpoint | Description | Request Body / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Root Health Check | — |
| `POST` | `/shop` | Run Buyer Agent Intent Matching | `{"query": "string"}` |
| `POST` | `/heal` | Trigger AI Healer & Anomaly Scan | — |
| `GET` | `/catalog` | Retrieve Converted Catalog Items | — |
| `GET` | `/failures` | Retrieve Structured Failure Logs | — |
| `GET` | `/audit` | Retrieve Timestamped Audit Trail | — |

---

## 5. GitHub Repository Link
* **URL**: [https://github.com/sameeermokhasi/Sentinel.git](https://github.com/sameeermokhasi/Sentinel.git)
* **Branch**: `main`
