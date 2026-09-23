import os
import json
import requests
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
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
                    
                    # Extract the destination phone number ID from incoming webhook metadata
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
                        
                        # Safely parse text body to prevent AttributeError on status updates or non-text messages
                        text_payload = message.get('text')
                        msg_body = text_payload.get('body', '').strip() if text_payload else ''
                        
                        if not sender_phone or not msg_body:
                            continue

                        print(f"📥 Received WhatsApp message from {sender_phone} on phone ID {incoming_phone_number_id}: {msg_body}")
                        
                        active_phone_id = incoming_phone_number_id or (campaign.whatsapp_phone_number_id if campaign else '')

                        # Check if a fully registered supporter already exists for this phone number
                        existing_supporter = Supporter.objects.filter(phone_number=sender_phone, registration_step='COMPLETED').first()

                        if existing_supporter:
                            if msg_body.lower() in ['hi', 'hello', 'hey', 'start', 'register']:
                                # Reset them back to start a fresh registration session
                                existing_supporter.registration_step = 'WAITING_FOR_NAME'
                                existing_supporter.full_name = ''
                                existing_supporter.ward = ''
                                existing_supporter.polling_station = ''
                                existing_supporter.political_allegiance = ''
                                existing_supporter.save()
                                send_whatsapp_message(active_phone_id, sender_phone, "Restarting registration. Please reply with your full name:")
                            else:
                                # Acknowledge they are registered, give campaign announcements, and instruct how to update
                                send_whatsapp_message(active_phone_id, sender_phone, "You are already registered! Stay tuned for our upcoming campaign announcements and rallies. If you wish to update your info, type \"START\".")
                            continue

                        # For users currently going through registration steps or starting fresh
                        supporter, created = Supporter.objects.get_or_create(
                            phone_number=sender_phone,
                            defaults={
                                'registration_step': 'START',
                                'campaign': campaign
                            }
                        )

                        if campaign and not supporter.campaign:
                            supporter.campaign = campaign

                        step = supporter.registration_step

                        # Rule 1: Only initialize/update tracking when "START" or keyword is clicked/typed
                        if msg_body.lower() in ['hi', 'hello', 'hey', 'start', 'register']:
                            supporter.registration_step = 'WAITING_FOR_NAME'
                            supporter.full_name = ''
                            supporter.ward = ''
                            supporter.polling_station = ''
                            supporter.political_allegiance = ''
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
                            send_whatsapp_message(active_phone_id, sender_phone, "Thank you! All your registration details have been successfully verified and saved to our database.")

                        else:
                            send_whatsapp_message(active_phone_id, sender_phone, "To begin or restart your campaign registration, please reply with 'START'.")
            
            return JsonResponse({'status': 'EVENT_RECEIVED'}, status=200)
        
        except Exception as e:
            print(f"❌ Error processing webhook: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=200)
            
    return HttpResponse(status=405)


@api_view(['POST'])
def broadcast_supporters(request):
    """
    Dedicated view for the candidate dashboard to send bulk WhatsApp notifications 
    regarding upcoming meetings, dates, and campaign rallies.
    """
    try:
        ward = request.data.get('ward')
        custom_ward = request.data.get('custom_ward')
        polling_station = request.data.get('polling_station')
        message_text = request.data.get('message')

        if not message_text:
            return Response({'error': 'Broadcast message body is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Target only fully registered supporters
        supporters = Supporter.objects.filter(registration_step='COMPLETED')

        # Filter by ward if specified
        target_ward = custom_ward if ward == 'CUSTOM_TYPED' else ward
        if target_ward:
            supporters = supporters.filter(ward__iexact=target_ward.strip())

        # Filter by polling station if specified
        if polling_station:
            supporters = supporters.filter(polling_station__iexact=polling_station.strip())

        sent_count = 0
        for supporter in supporters:
            if supporter.phone_number:
                phone_id = supporter.campaign.whatsapp_phone_number_id if supporter.campaign else None
                if phone_id:
                    send_whatsapp_message(phone_id, supporter.phone_number, message_text)
                    sent_count += 1

        return Response({
            'success': True, 
            'broadcast_sent_to': sent_count
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"❌ Error handling broadcast view: {e}")
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)