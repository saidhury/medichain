import requests
import os
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.conf import settings

from .models import MedicalRecord
from .serializers import MedicalRecordSerializer, RecordUploadSerializer
from users.models import User


def upload_to_pinata(file_content, filename):
    """Upload file to IPFS via Pinata"""
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    
    headers = {
        "pinata_api_key": settings.PINATA_API_KEY,
        "pinata_secret_api_key": settings.PINATA_SECRET_KEY,
    }
    
    files = {
        'file': (filename, file_content)
    }
    
    response = requests.post(url, files=files, headers=headers)
    
    if response.status_code == 200:
        return response.json()['IpfsHash']
    else:
        raise Exception(f"Pinata upload failed: {response.text}")


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_record(request):
    """Upload encrypted medical record to IPFS"""
    serializer = RecordUploadSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        data = serializer.validated_data
        patient_address = data['patient_address'].lower()
        encrypted_file = data['encrypted_file']
        iv = data['iv']
        file_hash = data['file_hash']
        filename = data['filename']
        
        # Verify patient exists
        try:
            patient = User.objects.get(wallet_address=patient_address, role='patient')
        except User.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get doctor from request (should be passed in headers or auth)
        doctor_address = request.headers.get('X-Wallet-Address', '').lower()
        if not doctor_address:
            return Response({'error': 'Doctor address required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            doctor = User.objects.get(wallet_address=doctor_address, role='doctor')
        except User.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Read file content
        file_content = encrypted_file.read()
        
        # Upload to IPFS
        cid = upload_to_pinata(file_content, filename)
        
        # Save to database
        record = MedicalRecord.objects.create(
            patient=patient,
            uploaded_by=doctor,
            ipfs_cid=cid,
            file_hash=file_hash,
            filename=filename,
            file_size=len(file_content),
            encryption_iv=iv
        )
        
        return Response({
            'message': 'Record uploaded successfully',
            'record_id': record.record_id,
            'ipfs_cid': cid,
            'file_hash': file_hash
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_patient_records(request, patient_address):
    """Get all records for a patient"""
    try:
        patient = User.objects.get(wallet_address=patient_address.lower())
        records = MedicalRecord.objects.filter(patient=patient)
        return Response(MedicalRecordSerializer(records, many=True).data)
    except User.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def update_tx_hash(request, record_id):
    """Update transaction hash after blockchain confirmation"""
    try:
        record = MedicalRecord.objects.get(record_id=record_id)
        tx_hash = request.data.get('tx_hash')
        
        if not tx_hash:
            return Response({'error': 'Transaction hash required'}, status=status.HTTP_400_BAD_REQUEST)
        
        record.tx_hash = tx_hash
        record.save()
        
        return Response({'message': 'Transaction hash updated'})
    except MedicalRecord.DoesNotExist:
        return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_record_by_cid(request, cid):
    """Get record metadata by IPFS CID"""
    try:
        record = MedicalRecord.objects.get(ipfs_cid=cid)
        return Response(MedicalRecordSerializer(record).data)
    except MedicalRecord.DoesNotExist:
        return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)