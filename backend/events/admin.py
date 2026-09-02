from django.contrib import admin
from .models import Event, Task

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'date_time', 'campaign')
    list_filter = ('campaign', 'date_time')
    search_fields = ('title', 'location')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'assigned_to', 'due_date', 'is_completed', 'campaign')
    list_filter = ('campaign', 'is_completed')
    search_fields = ('title', 'assigned_to')