from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['wallet_address', 'role', 'name', 'email', 'phone', 'hospital', 'specialty', 'created_at', 'is_active']
        read_only_fields = ['created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['wallet_address', 'role', 'name', 'email', 'phone', 'hospital', 'specialty']
    
    def validate_wallet_address(self, value):
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError("Invalid Ethereum address")
        return value.lower()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'email', 'phone', 'hospital', 'specialty']