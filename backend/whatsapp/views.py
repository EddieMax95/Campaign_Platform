import os
import json
import requests
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from supporters.models import Supporter, Campaign

VERIFY_TOKEN = os.getenv('WHATSAPP_VERIFY_TOKEN', 'my_secure_whatsapp_token_0630')

def send_whatsapp_message(phone_number_id, recipient_phone, message_text):
    token = ''
    if phone_number_id:
        campaign_obj = Campaign.objects.filter(whatsapp_phone_number_id=phone_number_id).first()
        if campaign_obj:
            print(f"🔍 Found Campaign: {campaign_obj.name} for Phone ID: {phone_number_id}")
            if campaign_obj.whatsapp_access_token:
                token = campaign_obj.whatsapp_access_token.strip()
                print(f"🔑 Token retrieved (Length: {len(token)}, Starts with: {token[:10]}...)")
            else:
                print(f"⚠️ Warning: Campaign '{campaign_obj.name}' exists, but 'whatsapp_access_token' field is empty!")
        else:
            print(f"❌ Error: No Campaign object found matching phone_number_id: {phone_number_id}")

    url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"
    
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
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"📤 Meta API Response Status: {response.status_code}")
        print(f"📤 Meta API Response Body: {response.text}")
        return response.json()
    except Exception as e:
        print(f"❌ Failed to send WhatsApp message: {e}")
        return {}

@csrf_exempt
def whatsapp_webhook(request):
    if request.method == 'GET':
        mode = request.GET.get('hub.mode')
        token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')

        if mode and token:
            if mode == 'subscribe' and token == VERIFY_TOKEN:
                return HttpResponse(challenge, status=200)
            else:
                return HttpResponse('Verification failed. Token mismatch.', status=403)
        return HttpResponse('Invalid verification request.', status=400)

    elif request.method == 'POST':
        try:
            body = json.loads(request.body.decode('utf-8'))
            print(f"📦 Incoming Payload: {body}")
            
            for entry in body.get('entry', []):
                for change in entry.get('changes', []):
                    value = change.get('value', {})
                    
                    # Extract the destination phone number ID from the incoming webhook metadata
                    metadata = value.get('metadata', {})
                    incoming_phone_number_id = metadata.get('phone_number_id')
                    
                    # Look up the campaign mapped to this specific phone number ID
                    campaign = None
                    if incoming_phone_number_id:
                        campaign = Campaign.objects.filter(whatsapp_phone_number_id=incoming_phone_number_id).first()
                    
                    # Fallback to default campaign if none matches
                    if not campaign:
                        campaign = Campaign.objects.first()

                    messages = value.get('messages', [])
                    
                    if messages:
                        message = messages[0]
                        sender_phone = message.get('from')
                        msg_body = message.get('text', {}).get('body', '').strip()
                        
                        print(f"📥 Received WhatsApp message from {sender_phone} on phone ID {incoming_phone_number_id}: {msg_body}")
                        
                        supporter, created = Supporter.objects.get_or_create(
                            phone_number=sender_phone,
                            defaults={
                                'registration_step': 'START',
                                'campaign': campaign
                            }
                        )

                        # Ensure existing supporter maps to the correct active campaign if not set
                        if campaign and not supporter.campaign:
                            supporter.campaign = campaign
                            supporter.save()

                        step = supporter.registration_step

                        # Use the incoming phone number ID to send responses from the exact same campaign number
                        active_phone_id = incoming_phone_number_id or (campaign.whatsapp_phone_number_id if campaign else '')

                        if step == 'START' or msg_body.lower() in ['hi', 'hello', 'hey', 'start', 'register']:
                            supporter.registration_step = 'WAITING_FOR_NAME'
                            supporter.save()
                            send_whatsapp_message(active_phone_id, sender_phone, "Welcome to the campaign! Let's get you registered. Please reply with your full name:")

                        elif step == 'WAITING_FOR_NAME':
                            supporter.full_name = msg_body
                            supporter.registration_step = 'WAITING_FOR_WARD'
                            supporter.save()
                            send_whatsapp_message(active_phone_id, sender_phone, f"Thanks {msg_body}! Which ward are you registered in?")

                        elif step == 'WAITING_FOR_WARD':
                            supporter.ward = msg_body
                            supporter.registration_step = 'WAITING_FOR_POLLING_STATION'
                            supporter.save()
                            send_whatsapp_message(active_phone_id, sender_phone, "Got it. What is your specific polling station?")

                        elif step == 'WAITING_FOR_POLLING_STATION':
                            supporter.polling_station = msg_body
                            supporter.registration_step = 'WAITING_FOR_ALLEGIANCE'
                            supporter.save()
                            send_whatsapp_message(active_phone_id, sender_phone, "Almost done! What is your political allegiance or movement preference?")

                        elif step == 'WAITING_FOR_ALLEGIANCE':
                            supporter.political_allegiance = msg_body
                            supporter.registration_step = 'COMPLETED'
                            supporter.save()
                            send_whatsapp_message(active_phone_id, sender_phone, "Thank you! Your registration details have been successfully saved to our database.")

                        else:
                            send_whatsapp_message(active_phone_id, sender_phone, "You are already registered in our system. Type 'START' if you wish to restart your registration.")
            
            return JsonResponse({'status': 'EVENT_RECEIVED'}, status=200)
        except Exception as e:
            print(f"❌ Error processing webhook: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
            
    return HttpResponse(status=405)