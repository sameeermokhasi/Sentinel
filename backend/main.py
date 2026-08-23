import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from catalog.catalog_manager import get_converted_catalog, convert_catalog
from agent.buyer_agent import process_shopping_request
from healer.catalog_healer import heal_all_unresolved
from healer.failure_logger import get_failures
from audit.audit_trail import get_audit_trail, log_action

app = FastAPI(
    title="Sentinel - AI Agent Catalog & Self-Healing Commerce API",
    description="Backend API powering Buyer Agent, Catalog Manager, Catalog Healer, Razorpay Integration, and Audit Trail",
    version="1.0.0"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ShopRequest(BaseModel):
    query: str


@app.on_event("startup")
def startup_event():
    """Ensure catalog is initialized on startup."""
    try:
        get_converted_catalog()
    except Exception as e:
        convert_catalog()


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Sentinel Agent Catalog API",
        "version": "1.0.0"
    }


@app.post("/shop")
def shop_endpoint(request: ShopRequest):
    """
    POST /shop
    Takes a natural language shopping request, runs Buyer Agent, returns result (success or structured failure).
    """
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")

    result = process_shopping_request(request.query)
    return result


@app.post("/heal")
def heal_endpoint():
    """
    POST /heal
    Runs catalog healer over all unresolved failure logs, applies LLM/heuristic patches,
    and returns a summary of fixed entries and anomaly scan results.
    """
    try:
        summary = heal_all_unresolved()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Catalog healing failed: {str(e)}")


@app.get("/catalog")
def get_catalog_endpoint():
    """
    GET /catalog
    Returns the current converted catalog items.
    """
    catalog = get_converted_catalog()
    return {
        "total_items": len(catalog),
        "needs_review_count": sum(1 for item in catalog if item.get("needs_review")),
        "catalog": catalog
    }


@app.get("/failures")
def get_failures_endpoint(status: Optional[str] = None):
    """
    GET /failures
    Returns current failure logs, optionally filtered by status ('unresolved', 'resolved').
    """
    failures = get_failures(status_filter=status)
    return {
        "total_failures": len(failures),
        "unresolved_count": sum(1 for f in failures if f.get("status") == "unresolved"),
        "failures": failures
    }


@app.get("/audit")
def get_audit_endpoint():
    """
    GET /audit
    Returns the complete end-to-end audit trail.
    """
    audit_trail = get_audit_trail()
    return {
        "total_actions": len(audit_trail),
        "audit_trail": audit_trail
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
