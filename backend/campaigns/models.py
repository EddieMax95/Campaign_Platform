from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token

class Campaign(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='campaign_profile', null=True, blank=True)
    name = models.CharField(max_length=255, unique=True)
    candidate_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    whatsapp_phone_number_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    whatsapp_access_token = models.TextField(null=True, blank=True)  # Added for individual campaign tokens
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

# Automatically generate a REST framework token, a campaign profile, and staff role whenever any User is created
@receiver(post_save, sender=User)
def create_user_campaign_profile(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

        if not instance.is_superuser:
            base_name = f"{instance.username.capitalize()}'s Campaign"
            campaign_name = base_name
            counter = 1
            while Campaign.objects.filter(name=campaign_name).exists():
                campaign_name = f"{base_name} {counter}"
                counter += 1

            campaign = Campaign.objects.create(
                user=instance,
                name=campaign_name,
                candidate_name=instance.username.capitalize(),
                email=instance.email if instance.email else ""
            )

            CampaignStaff.objects.create(
                user=instance,
                campaign=campaign,
                role='admin'
            )