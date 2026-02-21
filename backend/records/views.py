import requests
import hashlib
import base64
import os
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile
from io import BytesIO
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

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
    """Legacy upload endpoint - kept for compatibility"""
    # ... existing code ...
    pass


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_record_complete(request):
    """
    Complete upload pipeline: Encrypt → IPFS → DB
    Frontend only sends: patient_address, file, record_type, description
    Returns data needed for blockchain transaction
    """
    try:
        # Get doctor from header
        doctor_address = request.headers.get('X-Wallet-Address', '').lower()
        if not doctor_address:
            return Response({'error': 'Doctor address required'}, status=status.HTTP_400_BAD_REQUEST)
        
        patient_address = request.data.get('patient_address', '').lower()
        uploaded_file = request.FILES.get('file')
        record_type = request.data.get('record_type', 'unknown')
        description = request.data.get('description', '')
        
        if not patient_address:
            return Response({'error': 'Patient address required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not uploaded_file:
            return Response({'error': 'File required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"[UploadComplete] Doctor: {doctor_address}, Patient: {patient_address}, File: {uploaded_file.name}")
        
        # Step 1: Encrypt via encryption service
        print("[UploadComplete] Step 1: Encrypting file...")
        encrypt_url = settings.ENCRYPTION_SERVICE_URL + '/encrypt'
        
        files = {'file': (uploaded_file.name, uploaded_file.read(), uploaded_file.content_type)}
        
        try:
            encrypt_response = requests.post(encrypt_url, files=files, timeout=30)
            encrypt_response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"[UploadComplete] Encryption service error: {e}")
            return Response({'error': f'Encryption service unavailable: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        encrypt_data = encrypt_response.json()
        encrypted_content_b64 = encrypt_data['encrypted_content']
        iv = encrypt_data['iv']
        encryption_key = encrypt_data['key']
        file_hash = encrypt_data['hash']
        
        print(f"[UploadComplete] Encrypted. Hash: {file_hash[:20]}...")
        
        # Step 2: Upload encrypted file to IPFS
        print("[UploadComplete] Step 2: Uploading to IPFS...")
        try:
            encrypted_bytes = base64.b64decode(encrypted_content_b64)
            cid = upload_to_pinata(encrypted_bytes, f"{uploaded_file.name}.encrypted")
            print(f"[UploadComplete] IPFS CID: {cid}")
        except Exception as e:
            print(f"[UploadComplete] IPFS upload failed: {e}")
            return Response({'error': f'IPFS upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Step 3: Get or create patient
        try:
            patient = User.objects.get(wallet_address=patient_address, role='patient')
        except User.DoesNotExist:
            print(f"[UploadComplete] Creating new patient: {patient_address}")
            patient = User.objects.create(wallet_address=patient_address, role='patient')
        
        # Step 4: Get or create doctor
        try:
            doctor = User.objects.get(wallet_address=doctor_address, role='doctor')
        except User.DoesNotExist:
            print(f"[UploadComplete] Creating new doctor: {doctor_address}")
            doctor = User.objects.create(wallet_address=doctor_address, role='doctor')
        
        # Step 5: Save to DB
        print("[UploadComplete] Step 3: Saving to database...")
        record = MedicalRecord.objects.create(
            patient=patient,
            uploaded_by=doctor,
            ipfs_cid=cid,
            file_hash=f"0x{file_hash}",
            filename=uploaded_file.name,
            file_size=len(encrypted_bytes),
            encryption_iv=iv,
            record_type=record_type,
            description=description
        )
        
        print(f"[UploadComplete] Success! Record ID: {record.record_id}")
        
        # Return data for blockchain transaction
        return Response({
            'success': True,
            'record_id': record.record_id,
            'ipfs_cid': cid,
            'file_hash': f"0x{file_hash}",
            'encryption_iv': iv,
            'encryption_key': encryption_key,  # Frontend uses this temporarily
            'patient_address': patient_address,
            'message': 'Now sign blockchain transaction with MetaMask'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        print(f"[UploadComplete] Error: {str(e)}")
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def download_record(request):
    """
    Complete download: IPFS → Decrypt → Return file
    """
    try:
        user_address = request.headers.get('X-Wallet-Address', '').lower()
        record_id = request.data.get('record_id')
        encryption_key = request.data.get('encryption_key')
        
        if not record_id:
            return Response({'error': 'Record ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get record from DB
        try:
            record = MedicalRecord.objects.get(record_id=record_id)
        except MedicalRecord.DoesNotExist:
            return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify access
        has_access = (
            record.patient.wallet_address.lower() == user_address or
            record.uploaded_by.wallet_address.lower() == user_address
        )
        
        if not has_access:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        print(f"[Download] User {user_address} downloading record {record_id}")
        
        # Step 1: Download from IPFS
        print("[Download] Step 1: Fetching from IPFS...")
        ipfs_url = f"https://gateway.pinata.cloud/ipfs/{record.ipfs_cid}"
        
        try:
            ipfs_response = requests.get(ipfs_url, timeout=30)
            ipfs_response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"[Download] IPFS fetch failed: {e}")
            return Response({'error': f'Failed to fetch from IPFS: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        encrypted_bytes = ipfs_response.content
        print(f"[Download] Fetched {len(encrypted_bytes)} bytes from IPFS")
        
        # Step 2: Decrypt via encryption service
        print("[Download] Step 2: Decrypting...")
        
        # For demo: if no key provided, return encrypted (patient must provide)
        if not encryption_key:
            # In production, use secure key retrieval from KMS
            return Response({
                'error': 'Decryption key required',
                'message': 'Please provide encryption key or use key management service',
                'ipfs_cid': record.ipfs_cid,  # Allow direct IPFS access as fallback
                'filename': record.filename
            }, status=status.HTTP_400_BAD_REQUEST)
        
        encrypt_url = settings.ENCRYPTION_SERVICE_URL + '/decrypt'
        
        encrypted_b64 = base64.b64encode(encrypted_bytes).decode('utf-8')
        
        decrypt_data = {
            'encrypted_content': encrypted_b64,
            'iv': record.encryption_iv,
            'key': encryption_key
        }
        
        try:
            decrypt_response = requests.post(encrypt_url, data=decrypt_data, timeout=30)
            decrypt_response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"[Download] Decryption failed: {e}")
            return Response({'error': f'Decryption service error: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        decrypt_result = decrypt_response.json()
        decrypted_bytes = base64.b64decode(decrypt_result['content_base64'])
        print(f"[Download] Decrypted to {len(decrypted_bytes)} bytes")
        
        # Step 3: Verify hash
        print("[Download] Step 3: Verifying integrity...")
        computed_hash = hashlib.sha256(decrypted_bytes).hexdigest()
        expected_hash = record.file_hash.replace('0x', '').lower()
        
        if computed_hash.lower() != expected_hash:
            print(f"[Download] HASH MISMATCH! Expected: {expected_hash[:20]}..., Got: {computed_hash[:20]}...")
            return Response({'error': 'File integrity check failed - possible tampering'}, status=status.HTTP_400_BAD_REQUEST)
        
        print("[Download] Hash verified OK")
        
        # Step 4: Return file
        response = HttpResponse(decrypted_bytes, content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{record.filename}"'
        response['X-Record-ID'] = str(record.record_id)
        response['X-IPFS-CID'] = record.ipfs_cid
        
        print(f"[Download] Success! Returning {record.filename}")
        return response
        
    except Exception as e:
        import traceback
        print(f"[Download] Error: {str(e)}")
        print(traceback.format_exc())
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
        
        print(f"[UpdateTx] Record {record_id} updated with tx: {tx_hash[:20]}...")
        
        return Response({'message': 'Transaction hash updated', 'record_id': record_id})
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


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def sync_blockchain_record(request):
    """
    Sync a record that exists on blockchain but not in backend DB.
    Called when user wants to merge blockchain-only records.
    """
    try:
        doctor_address = request.headers.get('X-Wallet-Address', '').lower()
        if not doctor_address:
            return Response({'error': 'Doctor address required'}, status=status.HTTP_400_BAD_REQUEST)
        
        patient_address = request.data.get('patient_address', '').lower()
        cid = request.data.get('ipfs_cid')
        file_hash = request.data.get('file_hash')
        filename = request.data.get('filename', 'Unknown')
        file_size = request.data.get('file_size', 0)
        record_type = request.data.get('record_type', 'unknown')
        description = request.data.get('description', '')
        tx_hash = request.data.get('tx_hash', '')
        encryption_iv = request.data.get('encryption_iv', '')
        
        # Check if already exists
        existing = MedicalRecord.objects.filter(ipfs_cid=cid).first()
        if existing:
            return Response({
                'message': 'Record already exists in backend',
                'record_id': existing.record_id
            })
        
        # Get or create patient
        try:
            patient = User.objects.get(wallet_address=patient_address, role='patient')
        except User.DoesNotExist:
            patient = User.objects.create(wallet_address=patient_address, role='patient')
        
        # Get or create doctor (the original uploader, not current user)
        original_doctor = request.data.get('doctor_address', '').lower()
        if original_doctor:
            try:
                doctor = User.objects.get(wallet_address=original_doctor, role='doctor')
            except User.DoesNotExist:
                doctor = User.objects.create(wallet_address=original_doctor, role='doctor')
        else:
            doctor = User.objects.get(wallet_address=doctor_address, role='doctor')
        
        # Create record
        record = MedicalRecord.objects.create(
            patient=patient,
            uploaded_by=doctor,
            ipfs_cid=cid,
            file_hash=file_hash,
            filename=filename,
            file_size=file_size,
            encryption_iv=encryption_iv,
            record_type=record_type,
            description=description,
            tx_hash=tx_hash
        )
        
        print(f"[SyncBlockchain] Created record {record.record_id} for CID {cid}")
        
        return Response({
            'success': True,
            'record_id': record.record_id,
            'message': 'Blockchain record synced to backend'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        print(f"[SyncBlockchain] Error: {str(e)}")
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)