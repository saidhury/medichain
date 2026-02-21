from django.db import models


class User(models.Model):
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
    ]
    
    wallet_address = models.CharField(max_length=42, unique=True, primary_key=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    
    # New profile fields
    name = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    hospital = models.CharField(max_length=255, blank=True, default='')  # For doctors
    specialty = models.CharField(max_length=255, blank=True, default='')  # For doctors
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.name or self.wallet_address} ({self.role})"