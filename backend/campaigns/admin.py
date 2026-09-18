from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Campaign, CampaignStaff

class CampaignStaffInline(admin.StackedInline):
    model = CampaignStaff
    can_delete = False
    extra = 0

# Unregister the default User admin so we can attach the inline profile view
admin.site.unregister(User)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [CampaignStaffInline]

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'candidate_name', 'phone', 'whatsapp_phone_number_id', 'created_at')
    search_fields = ('name', 'candidate_name', 'phone', 'whatsapp_phone_number_id')

@admin.register(CampaignStaff)
class CampaignStaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'campaign', 'role')
    list_filter = ('campaign', 'role')