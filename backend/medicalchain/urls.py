from django.contrib import admin
from django.urls import path
from users import views as user_views
from records import views as record_views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # User endpoints
    path('api/users/register/', user_views.register_user, name='register'),
    path('api/users/<str:wallet_address>/', user_views.get_user, name='get_user'),
    path('api/users/<str:wallet_address>/update/', user_views.update_profile, name='update_profile'),
    path('api/users/doctors/list/', user_views.list_doctors, name='list_doctors'),
    path('api/users/doctors/search/', user_views.search_doctors, name='search_doctors'),
    path('api/users/patients/resolve/', user_views.resolve_patient, name='resolve_patient'),
    
    # Record endpoints
    path('api/records/upload/', record_views.upload_record, name='upload_record'),
    path('api/records/upload-complete/', record_views.upload_record_complete, name='upload_record_complete'),
    path('api/records/download/', record_views.download_record, name='download_record'),
    path('api/records/sync-blockchain/', record_views.sync_blockchain_record, name='sync_blockchain'),
    path('api/records/patient/<str:patient_address>/', record_views.get_patient_records, name='patient_records'),
    path('api/records/<int:record_id>/tx/', record_views.update_tx_hash, name='update_tx'),
    path('api/records/cid/<str:cid>/', record_views.get_record_by_cid, name='get_by_cid'),
]