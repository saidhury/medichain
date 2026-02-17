from rest_framework import serializers
from .models import MedicalRecord


class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_address = serializers.CharField(source='patient_id', read_only=True)
    doctor_address = serializers.CharField(source='uploaded_by_id', read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = [
            'record_id', 'patient_address', 'doctor_address', 'ipfs_cid',
            'file_hash', 'filename', 'file_size', 'created_at', 'tx_hash'
        ]


class RecordUploadSerializer(serializers.Serializer):
    patient_address = serializers.CharField(max_length=42)
    encrypted_file = serializers.FileField()
    iv = serializers.CharField(max_length=100)
    file_hash = serializers.CharField(max_length=66)
    filename = serializers.CharField(max_length=255)