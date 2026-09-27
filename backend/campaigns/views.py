import qrcode
import io
import base64
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Campaign
from .serializers import CampaignSerializer

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Campaign.objects.all()
        if hasattr(user, 'staff_profile') and user.staff_profile.campaign:
            return Campaign.objects.filter(id=user.staff_profile.campaign.id)
        return Campaign.objects.none()

    @action(detail=True, methods=['get'], url_path='qr-code')
    def generate_whatsapp_qr(self, request, pk=None):
        """
        Generates a unique, print-ready scannable QR code image for a specific candidate's campaign.
        When scanned, it opens WhatsApp with 'START' pre-filled for this exact campaign number.
        """
        try:
            campaign = self.get_object()
            
            if not campaign.whatsapp_phone_number_id:
                return Response({"error": "WhatsApp phone number not configured for this campaign."}, status=status.HTTP_400_BAD_REQUEST)

            # Clean phone number for the deep link format
            phone_number = str(campaign.whatsapp_phone_number_id).strip().replace("+", "")
            
            # Construct the WhatsApp deep link with pre-filled text
            whatsapp_link = f"https://wa.me/{phone_number}?text=START"

            # Generate high-resolution QR code optimized for printing and outdoor scanning
            qr = qrcode.QRCode(
                version=2,
                error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction to withstand print smudges
                box_size=10,
                border=4,
            )
            qr.add_data(whatsapp_link)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")
            
            # Save image to a bytes buffer
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

            # Convert to Base64 so frontend can render and print it directly via an <img> tag
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

            return Response({
                "success": True,
                "campaign_name": campaign.name,
                "candidate_name": campaign.candidate_name,
                "whatsapp_link": whatsapp_link,
                "qr_code_base64": f"data:image/png;base64,{image_base64}"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)