class UnsupportedDocumentTypeError(ValueError):
    """Exception raised when an uploaded document type is not supported by the extraction service."""
    def __init__(self, message: str, filename: str, mime_type: str):
        super().__init__(message)
        self.filename = filename
        self.mime_type = mime_type
