from django.db import models
from users.models import User


class MedicalRecord(models.Model):
    RECORD_TYPES = [
        ('lab', 'Lab Results'),
        ('imaging', 'Imaging & Radiology'),
        ('prescription', 'Prescription'),
        ('discharge', 'Discharge Summary'),
        ('referral', 'Referral Letter'),
        ('vaccination', 'Immunization Record'),
        ('ayush', 'AYUSH Record'),
        ('unknown', 'Unknown'),
    ]
    
    record_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='records_as_patient', to_field='wallet_address')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='records_as_doctor', to_field='wallet_address')
    ipfs_cid = models.CharField(max_length=100)
    file_hash = models.CharField(max_length=66)  # 0x + 64 hex chars
    filename = models.CharField(max_length=255)
    file_size = models.IntegerField()
    encryption_iv = models.CharField(max_length=50, null=True, blank=True)
    
    # NEW FIELDS
    record_type = models.CharField(max_length=20, choices=RECORD_TYPES, default='unknown')
    description = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    tx_hash = models.CharField(max_length=66, null=True, blank=True)
    
    class Meta:
        db_table = 'medical_records'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Record {self.record_id} for {self.patient_id}"