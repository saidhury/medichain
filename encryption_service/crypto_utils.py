import hashlib
import base64
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad


class EncryptionService:
    def __init__(self, key: bytes = None):
        """Initialize with 32-byte key for AES-256"""
        if key is None:
            self.key = get_random_bytes(32)
        else:
            if len(key) != 32:
                raise ValueError("Key must be 32 bytes for AES-256")
            self.key = key
    
    def encrypt_file(self, file_content: bytes) -> dict:
        """
        Encrypt file using AES-256-CBC
        Returns: {
            'encrypted_content': base64_encoded,
            'iv': base64_encoded,
            'key': base64_encoded  # In production, use secure key management
        }
        """
        # Generate random IV
        iv = get_random_bytes(16)
        
        # Create cipher
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        
        # Pad and encrypt
        padded_data = pad(file_content, AES.block_size)
        encrypted = cipher.encrypt(padded_data)
        
        return {
            'encrypted_content': base64.b64encode(encrypted).decode('utf-8'),
            'iv': base64.b64encode(iv).decode('utf-8'),
            'key': base64.b64encode(self.key).decode('utf-8'),
            'hash': self.compute_hash(file_content)
        }
    
    def decrypt_file(self, encrypted_content: str, iv: str, key: str) -> bytes:
        """Decrypt file content"""
        encrypted_bytes = base64.b64decode(encrypted_content)
        iv_bytes = base64.b64decode(iv)
        key_bytes = base64.b64decode(key)
        
        cipher = AES.new(key_bytes, AES.MODE_CBC, iv_bytes)
        decrypted = cipher.decrypt(encrypted_bytes)
        
        return unpad(decrypted, AES.block_size)
    
    @staticmethod
    def compute_hash(file_content: bytes) -> str:
        """Compute SHA256 hash of file content"""
        return hashlib.sha256(file_content).hexdigest()
    
    def verify_file(self, file_content: bytes, expected_hash: str) -> dict:
        """Verify file integrity by comparing hashes"""
        computed_hash = self.compute_hash(file_content)
        
        return {
            'verified': computed_hash.lower() == expected_hash.lower(),
            'computed_hash': computed_hash,
            'expected_hash': expected_hash,
            'tampered': computed_hash.lower() != expected_hash.lower()
        }


def get_encryption_service():
    """Factory function to get encryption service instance"""
    # In production, load key from secure environment/secrets manager
    key = get_random_bytes(32)
    return EncryptionService(key)