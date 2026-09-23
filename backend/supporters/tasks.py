import requests
import logging
from celery import shared_task
from campaigns.models import Campaign

logger = logging.getLogger(__name__)

@shared_task
def send_broadcast_task(recipients, message, campaign_id):
    """
    Asynchronously processes and dispatches WhatsApp messages via Meta Graph API.
    """
    try:
        campaign = Campaign.objects.filter(id=campaign_id).first()
        if not campaign or not campaign.whatsapp_phone_number_id or not campaign.whatsapp_access_token:
            logger.error(f"WhatsApp credentials missing for campaign ID: {campaign_id}")
            return

        phone_number_id = campaign.whatsapp_phone_number_id
        access_token = campaign.whatsapp_access_token
        url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        sent_count = 0
        failed_count = 0

        for recipient in recipients:
            if not recipient:
                continue
            cleaned_phone = str(recipient).strip().replace("+", "")

            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": cleaned_phone,
                "type": "text",
                "text": {"body": message}
            }

            try:
                response = requests.post(url, json=payload, headers=headers)
                if response.status_code in [200, 201]:
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                logger.error(f"Request Exception for {cleaned_phone}: {e}")
                failed_count += 1

        logger.info(f"Broadcast completed. Sent: {sent_count}, Failed: {failed_count}")
    except Exception as exc:
        logger.error(f"Broadcast task execution error: {exc}")
        raise exc