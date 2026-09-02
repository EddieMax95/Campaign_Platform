from django.db import models
from django.contrib.auth.models import User

class Campaign(models.Model):
    name = models.CharField(max_length=255, unique=True)
    candidate_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, unique=True)
    whatsapp_phone_number_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.candidate_name})"

class CampaignStaff(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='staff_members')
    role = models.CharField(max_length=50, choices=[('admin', 'Campaign Admin'), ('agent', 'Field Agent')], default='agent')

    def __str__(self):
        return f"{self.user.username} - {self.campaign.name} ({self.role})"