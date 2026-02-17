from django.contrib import admin
from .models import MedicalRecord

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['record_id', 'patient', 'uploaded_by', 'filename', 'created_at']
    list_filter = ['created_at', 'uploaded_by']
    search_fields = ['patient__wallet_address', 'ipfs_cid', 'filename']
    readonly_fields = ['created_at', 'record_id']