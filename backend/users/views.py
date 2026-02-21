from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer, UserProfileUpdateSerializer


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
            defaults={
                'role': role,
                'name': serializer.validated_data.get('name', ''),
                'email': serializer.validated_data.get('email', ''),
                'phone': serializer.validated_data.get('phone', ''),
                'hospital': serializer.validated_data.get('hospital', ''),
                'specialty': serializer.validated_data.get('specialty', ''),
            }
        )
        
        if not created:
            # Update existing user with new profile data if provided
            for field in ['name', 'email', 'phone', 'hospital', 'specialty']:
                if field in serializer.validated_data and serializer.validated_data[field]:
                    setattr(user, field, serializer.validated_data[field])
            user.save()
            
            return Response({
                'message': 'User already exists, profile updated',
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


@api_view(['POST'])
def update_profile(request, wallet_address):
    """Update user profile"""
    try:
        user = User.objects.get(wallet_address=wallet_address.lower())
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Profile updated successfully',
            'user': UserSerializer(user).data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_doctors(request):
    """List all registered doctors"""
    doctors = User.objects.filter(role='doctor', is_active=True)
    return Response(UserSerializer(doctors, many=True).data)


@api_view(['GET'])
def search_doctors(request):
    """Search doctors by name, email, hospital"""
    name = request.query_params.get('name', '')
    email = request.query_params.get('email', '')
    hospital = request.query_params.get('hospital', '')
    
    doctors = User.objects.filter(role='doctor', is_active=True)
    
    if name:
        doctors = doctors.filter(name__icontains=name)
    if email:
        doctors = doctors.filter(email__icontains=email)
    if hospital:
        doctors = doctors.filter(hospital__icontains=hospital)
    
    return Response(UserSerializer(doctors, many=True).data)


@api_view(['GET'])
def resolve_patient(request):
    """Resolve patient by email, phone, or wallet"""
    query = request.query_params.get('q', '')
    
    if not query:
        return Response({'error': 'Query required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Try exact wallet match first
    if query.startswith('0x') and len(query) == 42:
        try:
            patient = User.objects.get(wallet_address=query.lower(), role='patient')
            return Response(UserSerializer(patient).data)
        except User.DoesNotExist:
            pass
    
    # Try email or phone
    patients = User.objects.filter(role='patient', is_active=True).filter(
        models.Q(email__iexact=query) | 
        models.Q(phone__iexact=query) |
        models.Q(name__icontains=query)
    )
    
    if patients.exists():
        return Response(UserSerializer(patients.first()).data)
    
    return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)