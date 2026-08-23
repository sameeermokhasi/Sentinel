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
from agent.adversary_agent import generate_adversarial_queries, run_adversarial_suite
from healer.catalog_healer import heal_all_unresolved
from healer.failure_logger import get_failures
from healer.readiness_score import calculate_readiness_score, get_readiness_history
from audit.audit_trail import get_audit_trail, log_action

app = FastAPI(
    title="Sentinel - AI Agent Catalog & Self-Healing Commerce API",
    description="Backend API powering Buyer Agent, Adversary Agent, Catalog Healer, Readiness Score, Razorpay Integration, and Audit Trail",
    version="1.1.0"
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
    except Exception:
        convert_catalog()


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Sentinel Agent Catalog API",
        "version": "1.1.0"
    }


@app.post("/shop")
def shop_endpoint(request: ShopRequest):
    """
    POST /shop
    Takes a natural language shopping request, runs Buyer Agent, returns result (success or structured failure).
    On success, includes checkout_config formatted for Razorpay's Checkout.js frontend widget.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")

    result = process_shopping_request(request.query)
    return result


@app.post("/heal")
def heal_endpoint():
    """
    POST /heal
    Runs catalog healer over all unresolved failure logs, applies patches,
    runs ML anomaly detection, and automatically updates the Catalog AI-Readiness Score.
    """
    try:
        summary = heal_all_unresolved()
        # Automatically update readiness score after healing cycle
        readiness = calculate_readiness_score()
        summary["readiness_score"] = readiness.get("score")
        summary["readiness_breakdown"] = readiness.get("breakdown")
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Catalog healing failed: {str(e)}")


@app.post("/stress-test")
def stress_test_endpoint():
    """
    POST /stress-test
    1. Generates 10 adversarial queries using Groq LLM & runs 'before' stress test suite.
    2. Logs steps to audit trail.
    3. Automatically triggers Catalog Healer.
    4. Re-runs the exact same 10 queries for 'after' stress test suite.
    5. Computes queries fixed and updates Catalog AI-Readiness Score.
    6. Returns complete comparison object.
    """
    try:
        log_action("AdversaryAgent", "stress_test_started", "Initiating 10-query stress test suite", "success", details={"stage": "initiation"})

        # Step 1: Generate & Run 10 Adversarial Queries (Before)
        adversarial_queries = generate_adversarial_queries()
        before_report = run_adversarial_suite(adversarial_queries)
        log_action("AdversaryAgent", "stress_test_before_completed", "Completed before-healing stress test suite", "success", details={
            "succeeded": before_report["succeeded"],
            "failed": before_report["failed"]
        })

        # Step 2: Trigger Healer Pass
        log_action("CatalogHealer", "stress_test_healing_triggered", "Triggering autonomous catalog healing cycle during stress test", "success")
        healing_summary = heal_all_unresolved()

        # Step 3: Re-run exact same 10 queries (After)
        after_report = run_adversarial_suite(adversarial_queries)
        log_action("AdversaryAgent", "stress_test_after_completed", "Completed after-healing stress test suite", "success", details={
            "succeeded": after_report["succeeded"],
            "failed": after_report["failed"]
        })

        # Calculate queries fixed
        queries_fixed = []
        for before_d, after_d in zip(before_report["details"], after_report["details"]):
            if before_d["status"] == "failure" and after_d["status"] == "success":
                queries_fixed.append({
                    "query": before_d["query"],
                    "matched_product": after_d.get("matched_product")
                })

        # Step 4: Automatically update readiness score
        readiness = calculate_readiness_score()
        log_action("AdversaryAgent", "stress_test_completed", f"Stress test complete with readiness score {readiness.get('score')}", "success", details={
            "queries_fixed_count": len(queries_fixed),
            "final_readiness_score": readiness.get("score")
        })

        return {
            "status": "success",
            "before": {
                "succeeded": before_report["succeeded"],
                "failed": before_report["failed"]
            },
            "after": {
                "succeeded": after_report["succeeded"],
                "failed": after_report["failed"]
            },
            "queries_fixed_count": len(queries_fixed),
            "queries_fixed": queries_fixed,
            "readiness_score": readiness.get("score"),
            "readiness_breakdown": readiness.get("breakdown"),
            "healing_summary": healing_summary,
            "details_before": before_report["details"],
            "details_after": after_report["details"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stress test execution failed: {str(e)}")


@app.get("/readiness")
def get_readiness_endpoint():
    """
    GET /readiness
    Returns the current Catalog AI-Readiness Score (0-100) and a breakdown of its 3 components.
    """
    return calculate_readiness_score()


@app.get("/readiness/history")
def get_readiness_history_endpoint():
    """
    GET /readiness/history
    Returns the full readiness_history.json history for charting and progress tracking.
    """
    history = get_readiness_history()
    return {
        "total_records": len(history),
        "history": history
    }


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
    Returns current failure logs, optionally filtered by status ('unresolved', 'resolved', 'no_match_unfixable').
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
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)
