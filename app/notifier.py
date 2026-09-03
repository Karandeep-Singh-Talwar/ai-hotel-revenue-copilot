import os
import requests

WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com/v17.0/")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID", "mock_phone_id")
ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "mock_token")
RECIPIENT_PHONE = os.getenv("RECIPIENT_PHONE", "919999999999")

def send_whatsapp_alert(message_body):
    """
    Sends a WhatsApp alert using the Meta Cloud API.
    Falls back to console print if tokens are not provided.
    """
    if ACCESS_TOKEN == "mock_token":
        print("\n" + "="*50)
        print(" [MOCK WHATSAPP MESSAGE SENT]")
        print(f"To: {RECIPIENT_PHONE}")
        print("-" * 50)
        print(message_body)
        print("="*50 + "\n")
        return True

    url = f"{WHATSAPP_API_URL}{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    data = {
        "messaging_product": "whatsapp",
        "to": RECIPIENT_PHONE,
        "type": "text",
        "text": {
            "body": message_body
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        print(f"[Notifier] WhatsApp alert sent successfully to {RECIPIENT_PHONE}")
        return True
    except Exception as e:
        print(f"[Notifier] Failed to send WhatsApp alert: {e}")
        return False
