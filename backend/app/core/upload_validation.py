from fastapi import UploadFile
from typing import Set
import re
from app.core.config import settings
from app.core.exceptions import UnsupportedDocumentTypeError

ALLOWED_MIME_TYPES: Set[str] = {
    "text/plain",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

def validate_upload(file: UploadFile, content: bytes) -> None:
    """
    Validates the uploaded file against security constraints.
    - Size limit
    - MIME type whitelist
    """
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise ValueError(f"File size exceeds the {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB limit.")
        
    base_mime_type = (file.content_type or "unknown").split(";")[0].strip()
    if base_mime_type not in ALLOWED_MIME_TYPES:
        raise UnsupportedDocumentTypeError(
            message=f"Unsupported file type: {file.content_type}",
            filename=file.filename or "unknown",
            mime_type=file.content_type or "unknown"
        )

def sanitize_filename(filename: str) -> str:
    """
    Strips directory paths and weird characters to prevent path traversal
    and ensure safe storage.
    """
    # Remove directory paths if any
    filename = filename.split("/")[-1].split("\\")[-1]
    # Remove characters that aren't alphanumeric, dot, underscore, or dash
    filename = re.sub(r'[^a-zA-Z0-9.\-_]', '_', filename)
    return filename or "unknown_file"
