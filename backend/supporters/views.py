import requests
from django.conf import settings
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Supporter
from .serializers import SupporterSerializer
from .tasks import send_broadcast_task

def send_whatsapp_message(phone_number_id, recipient_phone, message_text):
    """
    Independent helper function to send standard WhatsApp messages via Meta Graph API.
    """
    try:
        # Fetch token dynamically or use settings/campaign lookup
        from campaigns.models import Campaign
        campaign = Campaign.objects.filter(whatsapp_phone_number_id=phone_number_id).first()
        if not campaign:
            return
            
        url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {campaign.whatsapp_access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": str(recipient_phone).strip().replace("+", ""),
            "type": "text",
            "text": {"body": message_text}
        }
        requests.post(url, json=payload, headers=headers)
    except Exception as e:
        print(f"❌ Error sending WhatsApp message: {e}")


class SupporterViewSet(viewsets.ModelViewSet):
    queryset = Supporter.objects.all().order_by('-id')
    serializer_class = SupporterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_superuser:
            return queryset

        if hasattr(user, 'staff_profile'):
            return queryset.filter(campaign=user.staff_profile.campaign)

        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'staff_profile'):
            serializer.save(campaign=user.staff_profile.campaign)
        else:
            serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("SERIALIZER VALIDATION ERRORS:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='broadcast')
    def broadcast_message(self, request):
        phone_number = request.data.get('phone_number')
        phone_numbers = request.data.get('phone_numbers')
        ward = request.data.get('ward')
        polling_station = request.data.get('polling_station')
        message = request.data.get('message')

        if not message:
            return Response({"error": "Message content is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        campaign = None
        if hasattr(user, 'staff_profile') and user.staff_profile.campaign:
            campaign = user.staff_profile.campaign
        elif user.is_superuser:
            campaign_id = request.data.get('campaign_id')
            if campaign_id:
                from campaigns.models import Campaign
                campaign = Campaign.objects.filter(id=campaign_id).first()

        if not campaign or not campaign.whatsapp_phone_number_id or not campaign.whatsapp_access_token:
            return Response({"error": "WhatsApp credentials not configured for this campaign."}, status=status.HTTP_400_BAD_REQUEST)

        base_qs = self.get_queryset()

        recipients = []
        if phone_numbers and isinstance(phone_numbers, list):
            recipients = phone_numbers
        elif phone_number:
            recipients = [phone_number]
        elif polling_station:
            station_supporters = base_qs.filter(polling_station__iexact=polling_station.strip())
            recipients = [s.phone_number for s in station_supporters if s.phone_number]
        elif ward:
            ward_supporters = base_qs.filter(ward__iexact=ward.strip())
            recipients = [s.phone_number for s in ward_supporters if s.phone_number]
        else:
            recipients = [s.phone_number for s in base_qs if s.phone_number]

        if not recipients:
            return Response({"error": "No valid recipients found."}, status=status.HTTP_404_NOT_FOUND)

        send_broadcast_task.delay(recipients, message, campaign.id)

        return Response({
            "success": True,
            "detail": "Broadcast task successfully queued.",
            "total_targeted": len(recipients)
        }, status=status.HTTP_202_ACCEPTED)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def whatsapp_webhook(request):
    """
    Dedicated global webhook endpoint for Meta WhatsApp messages.
    Handles verification (GET) and incoming message routing/state tracking (POST).
    """
    # 1. Handle Meta Webhook Verification (GET request)
    if request.method == 'GET':
        hub_mode = request.GET.get('hub.mode')
        hub_challenge = request.GET.get('hub.challenge')
        hub_verify_token = request.GET.get('hub.verify_token')
        
        # Match this verify token with your configuration
        if hub_mode == 'subscribe' and hub_verify_token == 'your_verify_token_here':
            return HttpResponse(hub_challenge, status=200)
        return HttpResponse('Verification failed', status=403)

    # 2. Handle Incoming Messages (POST request)
    try:
        data = request.data
        entry = data.get('entry', [{}])[0]
        changes = entry.get('changes', [{}])[0]
        value = changes.get('value', {})
        messages = value.get('messages')

        if not messages:
            return HttpResponse(status=200)

        msg = messages[0]
        sender_phone = msg.get('from')
        msg_body = msg.get('text', {}).get('body', '').strip()
        active_phone_id = value.get('metadata', {}).get('phone_number_id')

        if not sender_phone or not msg_body:
            return HttpResponse(status=200)

        # Strictly check if user is already registered in DB
        existing_supporter = Supporter.objects.filter(phone_number=sender_phone, registration_step='COMPLETED').first()

        if existing_supporter:
            # Only 'RESTART' wipes their information and restarts onboarding
            if msg_body.lower() == 'restart':
                existing_supporter.registration_step = 'WAITING_FOR_NAME'
                existing_supporter.full_name = ''
                existing_supporter.ward = ''
                existing_supporter.polling_station = ''
                existing_supporter.save()
                send_whatsapp_message(active_phone_id, sender_phone, "Restarting registration. Please reply with your full name:")
            else:
                # Any other casual word gives the locked permanent campaign message
                send_whatsapp_message(
                    active_phone_id, 
                    sender_phone, 
                    "You are already registered! Keep up with our campaign updates. If you want to update your info, type \"RESTART\"."
                )
            return HttpResponse(status=200)

        # (Optional) Handle standard non-registered onboarding steps below if needed...

        return HttpResponse(status=200)

    except Exception as e:
        print(f"❌ Webhook Processing Error: {e}")
        return HttpResponse(status=200)