from django.urls import path
from .views import whatsapp_webhook, broadcast_supporters

urlpatterns = [
    path('webhook/', whatsapp_webhook, name='whatsapp-webhook'),
    path('supporters/broadcast/', broadcast_supporters, name='broadcast_supporters'),
]