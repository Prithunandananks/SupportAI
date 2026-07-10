import io
import logging
from abc import ABC, abstractmethod
from typing import Dict
from pypdf import PdfReader
from app.core.exceptions import UnsupportedDocumentTypeError

logger = logging.getLogger(__name__)

class DocumentExtractor(ABC):
    @abstractmethod
    def extract(self, content: bytes, filename: str) -> str:
        pass


class PlainTextExtractor(DocumentExtractor):
    def extract(self, content: bytes, filename: str) -> str:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError as e:
            logger.exception("UnicodeDecodeError while parsing text file: %s", filename)
            raise ValueError("Invalid text file encoding. Must be UTF-8.") from e


class PdfExtractor(DocumentExtractor):
    def extract(self, content: bytes, filename: str) -> str:
        try:
            reader = PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            if not text.strip():
                logger.warning(
                    "No text extracted from PDF '%s'. The PDF may be scanned or image-based.",
                    filename,
                )
                raise ValueError(
                    "No extractable text found. The PDF may be scanned or image-based."
                )
            return text.strip()
        except Exception as e:
            logger.exception("Exception while parsing PDF file: %s", filename)
            raise ValueError(f"Failed to parse PDF: {str(e)}") from e

class DocxExtractor(DocumentExtractor):
    def extract(self, content: bytes, filename: str) -> str:
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            paragraphs = []
            for p in doc.paragraphs:
                text = p.text.strip()
                if text:
                    paragraphs.append(text)
            return "\n".join(paragraphs)
        except Exception as e:
            logger.exception("Exception while parsing DOCX file: %s", filename)
            raise ValueError(f"Failed to parse DOCX: {str(e)}") from e


class ExtractionService:
    def __init__(self):
        self._extractors: Dict[str, DocumentExtractor] = {
            "text/plain": PlainTextExtractor(),
            "application/pdf": PdfExtractor(),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocxExtractor(),
        }

    def register_extractor(self, mime_type: str, extractor: DocumentExtractor):
        """Register a new extractor for a given MIME type."""
        self._extractors[mime_type] = extractor

    def extract_text(self, content: bytes, content_type: str, filename: str = "unknown") -> str:
        """
        Extracts text from the given file content bytes.
        """
        logger.info("Extraction started for file: %s (MIME: %s)", filename, content_type)
        
        extractor = self._extractors.get(content_type)
        if not extractor:
            logger.error("Unsupported file type: %s for file: %s", content_type, filename)
            raise UnsupportedDocumentTypeError(
                message=f"Unsupported file type: {content_type}",
                filename=filename,
                mime_type=content_type
            )
        
        result = extractor.extract(content, filename)
        logger.info("Extraction completed for file: %s. Extracted %d characters.", filename, len(result))
        return result
