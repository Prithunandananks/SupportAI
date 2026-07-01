from abc import ABC, abstractmethod
from typing import Any


class BackgroundTask(ABC):
    @abstractmethod
    async def execute(self, *args, **kwargs) -> Any:
        """Execute the background task."""
        pass
