from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import Supporter
from .serializers import SupporterSerializer

class SupporterViewSet(viewsets.ModelViewSet):
    serializer_class = SupporterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        campaign_staff = self.request.user.campaignstaff_set.first()
        if campaign_staff:
            return Supporter.objects.filter(campaign=campaign_staff.campaign)
        return Supporter.objects.none()

    def perform_create(self, serializer):
        campaign_staff = self.request.user.campaignstaff_set.first()
        if campaign_staff:
            serializer.save(campaign=campaign_staff.campaign)
        else:
            raise ValidationError("User is not assigned to any campaign.")