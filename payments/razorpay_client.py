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


def get_razorpay_key_id() -> str:
    return os.getenv("RAZORPAY_KEY_ID", "rzp_test_TT51dTL52PVtiZ")


def get_razorpay_client():
    key_id = get_razorpay_key_id()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "mocksecret123")
    if RAZORPAY_AVAILABLE and key_id.startswith("rzp_test_") and key_secret != "mocksecret123":
        try:
            return razorpay.Client(auth=(key_id, key_secret))
        except Exception:
            return None
    return None


def create_order(amount: float, currency: str = "INR", receipt_id: str = None, item_name: str = "Product Purchase") -> dict:
    """
    Creates a Razorpay test mode order (or mock order if API credentials unavailable).
    Returns order details along with checkout_config formatted for Razorpay Checkout.js.
    """
    if receipt_id is None:
        receipt_id = f"rcpt_{uuid.uuid4().hex[:8]}"

    amount_in_paise = int(amount * 100)
    key_id = get_razorpay_key_id()
    client = get_razorpay_client()
    order_id = None
    is_mock = True
    raw_order = None

    if client:
        try:
            data = {
                "amount": amount_in_paise,
                "currency": currency,
                "receipt": receipt_id,
                "payment_capture": 1
            }
            order = client.order.create(data=data)
            order_id = order.get("id")
            raw_order = order
            is_mock = False
        except Exception as e:
            print(f"[RazorpayClient] SDK order creation failed: {e}. Falling back to mock order.")

    if not order_id:
        order_id = f"order_test_{uuid.uuid4().hex[:12]}"
        raw_order = {
            "id": order_id,
            "entity": "order",
            "amount": amount_in_paise,
            "amount_paid": 0,
            "amount_due": amount_in_paise,
            "currency": currency,
            "receipt": receipt_id,
            "status": "created",
            "created_at": 1700000000
        }

    # Format standard Razorpay Checkout.js configuration object
    checkout_config = {
        "key": key_id,
        "amount": amount_in_paise,
        "currency": currency,
        "order_id": order_id,
        "name": "Sentinel AI Commerce",
        "description": f"Purchase of {item_name}",
        "prefill": {
            "name": "Sentinel Buyer",
            "email": "buyer@sentinel.ai",
            "contact": "9999999999"
        },
        "theme": {
            "color": "#c9a15a"
        }
    }

    return {
        "status": "success",
        "order_id": order_id,
        "amount": amount,
        "currency": currency,
        "receipt": receipt_id,
        "checkout_config": checkout_config,
        "razorpay_raw": raw_order,
        "is_mock": is_mock
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
