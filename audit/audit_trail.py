import json
import os
from datetime import datetime

AUDIT_FILE = os.path.join(os.path.dirname(__file__), "audit_trail.json")


def log_action(agent_name: str, action: str, reasoning: str, result: str, details: dict = None) -> dict:
    """
    Appends a structured audit record to audit_trail.json with a timestamp.
    """
    entry = {
        "id": f"audit_{int(datetime.now().timestamp() * 1000)}",
        "timestamp": datetime.now().isoformat(),
        "agent_name": agent_name,
        "action": action,
        "reasoning": reasoning,
        "result": result,
        "details": details or {}
    }

    audit_data = []
    if os.path.exists(AUDIT_FILE):
        try:
            with open(AUDIT_FILE, "r", encoding="utf-8") as f:
                audit_data = json.load(f)
        except Exception:
            audit_data = []

    audit_data.append(entry)

    with open(AUDIT_FILE, "w", encoding="utf-8") as f:
        json.dump(audit_data, f, indent=2)

    return entry


def get_audit_trail() -> list:
    """
    Retrieves all audit entries from audit_trail.json.
    """
    if os.path.exists(AUDIT_FILE):
        try:
            with open(AUDIT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []
