from abc import ABC, abstractmethod
from app.core.logger import logger

class EmailService(ABC):
    @abstractmethod
    async def send_password_reset_email(self, email: str, reset_url: str) -> None:
        pass

class DevelopmentEmailService(EmailService):
    async def send_password_reset_email(self, email: str, reset_url: str) -> None:
        logger.info(f"--- DEVELOPMENT EMAIL ---")
        logger.info(f"To: {email}")
        logger.info(f"Subject: Password Reset Request")
        logger.info(f"Body: Please reset your password using the following link: {reset_url}")
        logger.info(f"-------------------------")

# For now, just instantiate the development one.
email_service = DevelopmentEmailService()
