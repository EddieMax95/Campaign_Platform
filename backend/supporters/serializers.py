from rest_framework import serializers
from .models import Supporter

class SupporterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supporter
        fields = '__all__'