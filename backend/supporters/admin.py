from django.contrib import admin
from .models import Supporter

@admin.register(Supporter)
class SupporterAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone_number', 'ward', 'polling_station', 'is_volunteer', 'campaign', 'created_at')
    list_filter = ('campaign', 'ward', 'is_volunteer')
    search_fields = ('full_name', 'phone_number', 'ward')