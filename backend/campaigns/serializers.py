from rest_framework import serializers
from .models import Campaign, CampaignStaff

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'

class CampaignStaffSerializer(serializers.ModelSerializer):
    campaign = CampaignSerializer(read_only=True)
    
    class Meta:
        model = CampaignStaff
        fields = '__all__'