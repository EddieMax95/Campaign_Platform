from django.db import models
from campaigns.models import Campaign

class Supporter(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='supporters', null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, unique=True)
    ward = models.CharField(max_length=100, blank=True, null=True)
    polling_station = models.CharField(max_length=100, blank=True, null=True)
    political_allegiance = models.CharField(max_length=100, blank=True, null=True)
    is_volunteer = models.BooleanField(default=False)
    registration_step = models.CharField(max_length=50, default='START')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        campaign_name = self.campaign.name if self.campaign else "No Campaign"
        return f"{self.full_name or 'Unregistered'} - {self.ward or 'No Ward'} ({campaign_name})"