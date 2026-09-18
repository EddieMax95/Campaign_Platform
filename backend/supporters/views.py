import requests
from django.conf import settings
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Supporter
from .serializers import SupporterSerializer

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
        phone_numbers = request.data.get('phone_numbers')  # Added to accept filtered arrays from frontend
        ward = request.data.get('ward')
        message = request.data.get('message')

        if not message:
            return Response({"error": "Message content is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Dynamically fetch campaign credentials based on the logged-in user
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

        phone_number_id = campaign.whatsapp_phone_number_id
        access_token = campaign.whatsapp_access_token
        url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"

        # Base queryset scoped to user's permissions
        base_qs = self.get_queryset()

        recipients = []
        if phone_numbers and isinstance(phone_numbers, list):
            # Explicit list of filtered recipients from frontend table
            recipients = phone_numbers
        elif phone_number:
            # Direct 1-to-1 message scenario
            recipients = [phone_number]
        elif ward:
            # Ward broadcast scenario
            ward_supporters = base_qs.filter(ward__iexact=ward.strip())
            recipients = [s.phone_number for s in ward_supporters if s.phone_number]
        else:
            # Global broadcast scenario for this campaign
            recipients = [s.phone_number for s in base_qs if s.phone_number]

        if not recipients:
            return Response({"error": "No valid recipients found."}, status=status.HTTP_404_NOT_FOUND)

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
                print(f"Meta Status: {response.status_code}, Body: {response.text}")
                
                if response.status_code in [200, 201]:
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                print(f"Request Exception: {e}")
                failed_count += 1

        return Response({
            "success": True,
            "sent": sent_count,
            "failed": failed_count,
            "total_targeted": len(recipients)
        }, status=status.HTTP_200_OK)