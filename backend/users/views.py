from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer


@api_view(['POST'])
def register_user(request):
    """Register a new user with wallet address and role"""
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        wallet_address = serializer.validated_data['wallet_address'].lower()
        role = serializer.validated_data['role']
        
        # Check if user exists
        user, created = User.objects.get_or_create(
            wallet_address=wallet_address,
            defaults={'role': role}
        )
        
        if not created:
            return Response({
                'message': 'User already exists',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_user(request, wallet_address):
    """Get user details by wallet address"""
    try:
        user = User.objects.get(wallet_address=wallet_address.lower())
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def list_doctors(request):
    """List all registered doctors"""
    doctors = User.objects.filter(role='doctor', is_active=True)
    return Response(UserSerializer(doctors, many=True).data)