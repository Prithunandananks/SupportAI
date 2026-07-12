from fastapi import UploadFile
from typing import Set
import re
from app.core.config import settings
from app.core.exceptions import UnsupportedDocumentTypeError

ALLOWED_MIME_TYPES: Set[str] = {
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

ALLOWED_EXTENSIONS: Set[str] = {
    ".txt",
    ".md",
    ".pdf",
    ".docx"
}

def validate_upload(file: UploadFile, content: bytes) -> None:
    """
    Validates the uploaded file against security constraints.
    - Size limit
    - Empty files
    - MIME type whitelist
    - File extension
    """
    if not content:
        raise ValueError("File is empty.")

    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise ValueError(f"File size exceeds the {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB limit.")
        
    base_mime_type = (file.content_type or "unknown").split(";")[0].strip()
    if base_mime_type not in ALLOWED_MIME_TYPES:
        raise UnsupportedDocumentTypeError(
            message=f"Unsupported file type: {file.content_type}",
            filename=file.filename or "unknown",
            mime_type=file.content_type or "unknown"
        )
        
    filename = file.filename or ""
    import os
    _, ext = os.path.splitext(filename)
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file extension: {ext}")

def sanitize_filename(filename: str) -> str:
    """
    Strips directory paths and weird characters to prevent path traversal
    and ensure safe storage. Truncates long filenames.
    """
    # Remove directory paths if any
    filename = filename.split("/")[-1].split("\\")[-1]
    # Remove characters that aren't alphanumeric, dot, underscore, or dash
    filename = re.sub(r'[^a-zA-Z0-9.\-_]', '_', filename)
    
    filename = filename or "unknown_file"
    if len(filename) > 255:
        # truncate while preserving extension
        import os
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext
        
    return filename
