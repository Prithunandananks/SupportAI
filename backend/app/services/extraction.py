import io
from pypdf import PdfReader


class ExtractionService:
    @staticmethod
    def extract_text(content: bytes, content_type: str) -> str:
        if content_type == "text/plain":
            try:
                return content.decode("utf-8")
            except UnicodeDecodeError:
                raise ValueError("Invalid text file encoding. Must be UTF-8.")

        elif content_type == "application/pdf":
            try:
                reader = PdfReader(io.BytesIO(content))
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
            except Exception as e:
                raise ValueError(f"Failed to parse PDF: {str(e)}")

        else:
            raise ValueError(f"Unsupported file type: {content_type}")
