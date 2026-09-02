from django.contrib import admin
from .models import Campaign, CampaignStaff

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'candidate_name', 'phone', 'created_at')
    search_fields = ('name', 'candidate_name', 'phone')

@admin.register(CampaignStaff)
class CampaignStaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'campaign', 'role')
    list_filter = ('campaign', 'role')