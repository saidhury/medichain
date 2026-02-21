from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
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
    """Get user details - auto-creates from blockchain if missing"""
    import logging
    logger = logging.getLogger(__name__)
    
    wallet_address = wallet_address.lower().strip()
    
    # First try to get existing user
    try:
        user = User.objects.get(wallet_address=wallet_address)
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        pass  # Will auto-create below
    
    # Auto-create user from blockchain connection
    logger.info(f'[GetUser] Auto-creating user from blockchain: {wallet_address}')
    
    try:
        # Use get_or_create to handle race conditions gracefully
        user, created = User.objects.get_or_create(
            wallet_address=wallet_address,
            defaults={
                'role': 'patient',  # Default, they can change in profile
                'name': '',
                'email': '',
                'phone': '',
                'hospital': '',
                'specialty': '',
                'is_active': True,
            }
        )
        
        if created:
            logger.info(f'[GetUser] Successfully created user: {wallet_address}')
        else:
            logger.info(f'[GetUser] User was created by another request: {wallet_address}')
        
        response_data = UserSerializer(user).data
        if created:
            response_data['is_new'] = True
            response_data['message'] = 'User auto-created from blockchain. Please complete your profile.'
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f'[GetUser] Failed to auto-create user {wallet_address}: {str(e)}')
        # If creation failed, try one more time to get (in case of race condition)
        try:
            user = User.objects.get(wallet_address=wallet_address)
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Failed to create user', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
def update_profile(request, wallet_address):
    """Update user profile - auto-creates if missing (handles blockchain-only users)"""
    import logging
    logger = logging.getLogger(__name__)
    
    wallet_address = wallet_address.lower()
    data = request.data
    
    # Check if user exists, if not create them
    user, created = User.objects.get_or_create(
        wallet_address=wallet_address,
        defaults={
            'role': data.get('role', 'patient'),
            'name': data.get('name', ''),
            'email': data.get('email', ''),
            'phone': data.get('phone', ''),
            'hospital': data.get('hospital', ''),
            'specialty': data.get('specialty', ''),
        }
    )
    
    if created:
        logger.info(f'[UpdateProfile] Auto-created blockchain user: {wallet_address}')
    
    # Update with new data (merge with existing)
    update_fields = {}
    for field in ['name', 'email', 'phone', 'hospital', 'specialty', 'role']:
        if field in data and data[field]:  # Only update if provided and non-empty
            update_fields[field] = data[field]
    
    if update_fields:
        for field, value in update_fields.items():
            setattr(user, field, value)
        user.save()
        logger.info(f'[UpdateProfile] Updated fields for {wallet_address}: {list(update_fields.keys())}')
    
    return Response({
        'message': 'Profile created successfully' if created else 'Profile updated successfully',
        'user': UserSerializer(user).data,
        'was_created': created
    })

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


@api_view(['POST'])
def sync_user_from_blockchain(request):
    """
    Auto-recreate user from blockchain data when they connect but don't exist in DB.
    This handles the case where blockchain has data but local DB was reset.
    """
    wallet_address = request.data.get('wallet_address', '').lower()
    role = request.data.get('role', 'patient')  # Default to patient
    
    if not wallet_address or not wallet_address.startswith('0x'):
        return Response({'error': 'Valid wallet address required'}, status=400)
    
    try:
        with transaction.atomic():
            # Create user if not exists
            user, created = User.objects.get_or_create(
                wallet_address=wallet_address,
                defaults={
                    'role': role,
                    'name': f'User {wallet_address[:6]}...{wallet_address[-4:]}',
                    'is_active': True
                }
            )
            
            # If user existed but was soft-deleted, reactivate
            if not user.is_active:
                user.is_active = True
                user.save()
                created = True
            
            return Response({
                'success': True,
                'created': created,
                'user': UserSerializer(user).data,
                'message': 'User synced from blockchain' if created else 'User already exists'
            })
            
    except Exception as e:
        return Response({'error': str(e)}, status=500)