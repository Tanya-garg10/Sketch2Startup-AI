import json
import uuid
from functools import lru_cache
from typing import Optional
from datetime import datetime

import firebase_admin
from firebase_admin import auth, credentials, storage
from fastapi import HTTPException, Security, status, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

security = HTTPBearer()


@lru_cache(maxsize=1)
def get_firebase_app():
    if firebase_admin._apps:
        return firebase_admin.get_app()
    options = {"storageBucket": settings.firebase_storage_bucket} if settings.firebase_storage_bucket else None
    if settings.firebase_service_account_json:
        try:
            cred = credentials.Certificate(json.loads(settings.firebase_service_account_json))
            return firebase_admin.initialize_app(cred, options)
        except (json.JSONDecodeError, ValueError):
            # If service account JSON is invalid, initialize without it
            return firebase_admin.initialize_app(options=options)
    return firebase_admin.initialize_app(options=options)


def storage_status() -> dict[str, str]:
    try:
        get_firebase_app()
        bucket = storage.bucket() if settings.firebase_storage_bucket else None
        return {"provider": "firebase", "bucket": bucket.name if bucket else "not-configured"}
    except Exception as e:
        return {"provider": "firebase", "error": str(e), "bucket": "not-configured"}


async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Verify Firebase ID token and return user info."""
    try:
        get_firebase_app()
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "email_verified": decoded_token.get("email_verified", False),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Get current authenticated user."""
    return await verify_firebase_token(credentials)


async def optional_auth(credentials: Optional[HTTPAuthorizationCredentials] = Security(HTTPBearer(auto_error=False))) -> Optional[dict]:
    """Optional authentication - returns None if no valid token provided."""
    if not credentials:
        return None
    try:
        return await verify_firebase_token(credentials)
    except HTTPException:
        return None


async def upload_to_firebase(file: UploadFile, user_uid: str) -> str:
    """Upload file to Firebase Storage and return the public URL."""
    try:
        if not settings.firebase_storage_bucket:
            # In demo mode, return a fake URL
            return f"https://demo-storage.example.com/{user_uid}/{file.filename}"
        
        app = get_firebase_app()
        bucket = storage.bucket()
        
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{user_uid}/{timestamp}_{uuid.uuid4().hex[:8]}_{file.filename}"
        
        # Upload file
        blob = bucket.blob(unique_filename)
        content = await file.read()
        blob.upload_from_string(content, content_type=file.content_type)
        
        # Make file public
        blob.make_public()
        
        return blob.public_url
    except Exception as e:
        # If upload fails, return a demo URL
        if settings.demo_mode:
            return f"https://demo-storage.example.com/{user_uid}/{file.filename}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


def delete_from_firebase(file_url: str) -> bool:
    """Delete file from Firebase Storage."""
    try:
        if not settings.firebase_storage_bucket or settings.demo_mode:
            return True
        
        app = get_firebase_app()
        bucket = storage.bucket()
        
        # Extract blob name from URL
        blob_name = file_url.split(f"{settings.firebase_storage_bucket}/")[-1]
        blob = bucket.blob(blob_name)
        blob.delete()
        
        return True
    except Exception as e:
        print(f"Failed to delete file: {str(e)}")
        return False
