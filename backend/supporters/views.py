from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from .models import Supporter
from .serializers import SupporterSerializer

class SupporterViewSet(viewsets.ModelViewSet):
    queryset = Supporter.objects.all().order_by('-id')
    serializer_class = SupporterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_superuser:
            return queryset

        if hasattr(user, 'staff_profile'):
            return queryset.filter(campaign=user.staff_profile.campaign)

        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'staff_profile'):
            serializer.save(campaign=user.staff_profile.campaign)
        else:
            serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("SERIALIZER VALIDATION ERRORS:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)