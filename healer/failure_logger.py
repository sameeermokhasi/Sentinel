import json
import os
from datetime import datetime

FAILURE_LOGS_FILE = os.path.join(os.path.dirname(__file__), "failure_logs.json")


def log_failure(query: str, reason: str, missing_field: str, catalog_entry_id: str = None, details: dict = None) -> dict:
    """
    Appends a structured failure record to failure_logs.json with timestamp and status 'unresolved'.
    """
    failure_record = {
        "failure_id": f"FAIL-{int(datetime.now().timestamp() * 1000)}",
        "timestamp": datetime.now().isoformat(),
        "query": query,
        "reason": reason,
        "missing_field": missing_field,
        "catalog_entry_id": catalog_entry_id,
        "status": "unresolved",
        "details": details or {},
        "resolution_notes": None,
        "resolved_at": None
    }

    logs = get_failures()
    logs.append(failure_record)

    with open(FAILURE_LOGS_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2)

    return failure_record


def get_failures(status_filter: str = None) -> list:
    """
    Returns all failure records, optionally filtered by status ('unresolved', 'resolved', 'no_match_unfixable').
    """
    if os.path.exists(FAILURE_LOGS_FILE):
        try:
            with open(FAILURE_LOGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if status_filter:
                    return [rec for rec in data if rec.get("status") == status_filter]
                return data
        except Exception:
            return []
    return []


# Alias for compatibility
get_all_failures = get_failures


def mark_failure_status(failure_id: str, status: str, resolution_notes: str) -> dict:
    """
    Updates status ('resolved', 'no_match_unfixable', etc.) and resolution_notes for a failure log record.
    """
    logs = get_failures()
    target_record = None

    for rec in logs:
        if rec.get("failure_id") == failure_id:
            rec["status"] = status
            rec["resolution_notes"] = resolution_notes
            rec["resolved_at"] = datetime.now().isoformat()
            target_record = rec
            break

    if target_record:
        with open(FAILURE_LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)

    return target_record


def mark_failure_resolved(failure_id: str, resolution_notes: str) -> dict:
    """
    Marks a failure log record as 'resolved' with details of what was fixed.
    """
    return mark_failure_status(failure_id, "resolved", resolution_notes)
