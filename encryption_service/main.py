from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import base64
import io

from crypto_utils import EncryptionService, get_encryption_service

app = FastAPI(title="Medical Records Encryption Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service
encryption_service = get_encryption_service()


class EncryptResponse(BaseModel):
    encrypted_content: str
    iv: str
    key: str
    hash: str
    success: bool


class VerifyRequest(BaseModel):
    file_content_base64: str
    expected_hash: str


class VerifyResponse(BaseModel):
    verified: bool
    computed_hash: str
    expected_hash: str
    tampered: bool
    message: str


@app.post("/encrypt", response_model=EncryptResponse)
async def encrypt_file(file: UploadFile = File(...)):
    """
    Encrypt uploaded file and return encrypted content + hash
    """
    try:
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Encrypt
        result = encryption_service.encrypt_file(content)
        result['success'] = True
        
        return EncryptResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")


@app.post("/verify", response_model=VerifyResponse)
async def verify_file(
    file: UploadFile = File(...),
    expected_hash: str = Form(...)
):
    """
    Verify file integrity against expected hash
    """
    try:
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        result = encryption_service.verify_file(content, expected_hash)
        
        if result['tampered']:
            result['message'] = "WARNING: File has been tampered with!"
        else:
            result['message'] = "File verified successfully. Integrity confirmed."
        
        return VerifyResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@app.post("/decrypt")
async def decrypt_file(
    encrypted_content: str = Form(...),
    iv: str = Form(...),
    key: str = Form(...)
):
    """
    Decrypt file content (for authorized access)
    """
    try:
        decrypted = encryption_service.decrypt_file(encrypted_content, iv, key)
        
        return {
            "success": True,
            "content_base64": base64.b64encode(decrypted).decode('utf-8'),
            "size": len(decrypted)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "encryption"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)