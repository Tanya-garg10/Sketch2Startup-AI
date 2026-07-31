import json
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, storage

from app.core.config import settings


@lru_cache(maxsize=1)
def get_firebase_app():
    if firebase_admin._apps:
        return firebase_admin.get_app()
    options = {"storageBucket": settings.firebase_storage_bucket} if settings.firebase_storage_bucket else None
    if settings.firebase_service_account_json:
        cred = credentials.Certificate(json.loads(settings.firebase_service_account_json))
        return firebase_admin.initialize_app(cred, options)
    return firebase_admin.initialize_app(options=options)


def storage_status() -> dict[str, str]:
    get_firebase_app()
    bucket = storage.bucket() if settings.firebase_storage_bucket else None
    return {"provider": "firebase", "bucket": bucket.name if bucket else "not-configured"}
