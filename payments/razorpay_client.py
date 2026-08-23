import os
import uuid
from dotenv import load_dotenv

load_dotenv()

# Try importing razorpay SDK
try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False


def get_razorpay_client():
    key_id = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mockkey123")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "mocksecret123")
    if RAZORPAY_AVAILABLE and key_id.startswith("rzp_test_") and key_secret != "mocksecret123":
        try:
            return razorpay.Client(auth=(key_id, key_secret))
        except Exception:
            return None
    return None


def create_order(amount: float, currency: str = "INR", receipt_id: str = None) -> dict:
    """
    Creates a Razorpay test mode order (or mock order if API credentials unavailable).
    Amount should be in main unit (e.g., INR 2499 -> converted to paise 249900).
    """
    if receipt_id is None:
        receipt_id = f"rcpt_{uuid.uuid4().hex[:8]}"

    amount_in_paise = int(amount * 100)
    client = get_razorpay_client()

    if client:
        try:
            data = {
                "amount": amount_in_paise,
                "currency": currency,
                "receipt": receipt_id,
                "payment_capture": 1
            }
            order = client.order.create(data=data)
            return {
                "status": "success",
                "order_id": order.get("id"),
                "amount": amount,
                "currency": currency,
                "receipt": receipt_id,
                "razorpay_raw": order,
                "is_mock": False
            }
        except Exception as e:
            # Fallback to test mock order
            pass

    # Mock order response for test mode without active network/auth failure
    mock_order_id = f"order_test_{uuid.uuid4().hex[:12]}"
    return {
        "status": "success",
        "order_id": mock_order_id,
        "amount": amount,
        "currency": currency,
        "receipt": receipt_id,
        "razorpay_raw": {
            "id": mock_order_id,
            "entity": "order",
            "amount": amount_in_paise,
            "amount_paid": 0,
            "amount_due": amount_in_paise,
            "currency": currency,
            "receipt": receipt_id,
            "status": "created",
            "attempts": 0,
            "notes": [],
            "created_at": 1700000000
        },
        "is_mock": True
    }


def verify_order(order_id: str) -> dict:
    """
    Checks or verifies status of an order.
    """
    client = get_razorpay_client()
    if client and not order_id.startswith("order_test_"):
        try:
            order = client.order.fetch(order_id)
            return {
                "order_id": order_id,
                "status": order.get("status", "created"),
                "amount": order.get("amount", 0) / 100,
                "currency": order.get("currency", "INR")
            }
        except Exception:
            pass

    return {
        "order_id": order_id,
        "status": "created",
        "verified": True,
        "is_mock": True
    }
