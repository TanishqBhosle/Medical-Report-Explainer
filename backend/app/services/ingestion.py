import os
import hashlib
import uuid
import re
from pathlib import Path
from fastapi import UploadFile, HTTPException

from app.core.config import settings
from app.core.logging import logger

MAGIC_NUMBERS = {
    "pdf": b"%PDF",
    "png": b"\x89PNG\r\n\x1a\n",
    "jpg": b"\xff\xd8\xff",
    "jpeg": b"\xff\xd8\xff",
}


def sanitize_filename(filename: str) -> str:
    # Strip any directory path components
    base_name = os.path.basename(filename)
    # Remove any non-alphanumeric, dot, underscore, dash
    sanitized = re.sub(r'[^a-zA-Z0-9._-]', '_', base_name)
    return sanitized or "report"


def validate_file_signature(content: bytes, ext: str) -> bool:
    expected_magic = MAGIC_NUMBERS.get(ext)
    if not expected_magic:
        return False
    return content.startswith(expected_magic) or (ext in ("jpg", "jpeg") and content[:2] == b"\xff\xd8")


class IngestionService:
    @staticmethod
    async def process_upload(file: UploadFile) -> dict:
        filename = sanitize_filename(file.filename or "unknown")
        ext = filename.split(".")[-1].lower() if "." in filename else ""

        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail={"code": "UNSUPPORTED_FILE_TYPE", "message": f"Supported file formats are: {', '.join(settings.ALLOWED_EXTENSIONS)}"}
            )

        content = await file.read()
        file_size = len(content)

        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail={"code": "FILE_INVALID_OR_CORRUPT", "message": "The uploaded file is empty."}
            )

        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail={"code": "FILE_TOO_LARGE", "message": f"File size exceeds maximum allowed size ({settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB)."}
            )

        if not validate_file_signature(content, ext):
            raise HTTPException(
                status_code=415,
                detail={"code": "FILE_INVALID_OR_CORRUPT", "message": "File signature does not match its extension."}
            )

        sha256_hash = hashlib.sha256(content).hexdigest()

        # Ensure storage directory exists
        storage_path = Path(settings.STORAGE_DIR)
        storage_path.mkdir(parents=True, exist_ok=True)

        storage_key = f"{uuid.uuid4().hex}.{ext}"
        destination = storage_path / storage_key

        with open(destination, "wb") as f:
            f.write(content)

        logger.info(f"Ingested file {filename} as {storage_key} ({file_size} bytes)")

        return {
            "original_filename": filename,
            "media_type": file.content_type or f"application/{ext}",
            "file_size_bytes": file_size,
            "storage_key": storage_key,
            "sha256": sha256_hash,
            "file_path": str(destination),
            "ext": ext
        }

    @staticmethod
    def delete_stored_file(storage_key: str) -> bool:
        try:
            target = Path(settings.STORAGE_DIR) / storage_key
            if target.exists():
                target.unlink()
                logger.info(f"Deleted stored file {storage_key}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file {storage_key}: {e}")
            return False
