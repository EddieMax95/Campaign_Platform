import requests
from django.conf import settings

def send_whatsapp_message(recipient_phone, message_text):
    token = getattr(settings, 'WHATSAPP_ACCESS_TOKEN', 'YOUR_PERMANENT_OR_TEMP_TOKEN')
    phone_number_id = getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', '1244739615397119')
    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_phone,
        "type": "text",
        "text": {"body": message_text}
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()