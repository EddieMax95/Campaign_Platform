from rest_framework import viewsets, permissions
from .models import Campaign
from .serializers import CampaignSerializer

class CampaignViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Campaign.objects.all()
        if hasattr(user, 'staff_profile') and user.staff_profile.campaign:
            return Campaign.objects.filter(id=user.staff_profile.campaign.id)
        return Campaign.objects.none()