# models.py
from django.db import models


class WhatsAppCampaign(models.Model):
  name = models.CharField(max_length=255)
  phone_number_id = models.CharField(
      max_length=100,
      unique=True,
      help_text=(
          "The WhatsApp Phone Number ID assigned to this specific campaign"
          " tenant."
      ),
  )
  waba_id = models.CharField(
      max_length=100,
      blank=True,
      null=True,
      help_text="WhatsApp Business Account ID",
  )
  is_active = models.BooleanField(default=True)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f"{self.name} ({self.phone_number_id})"