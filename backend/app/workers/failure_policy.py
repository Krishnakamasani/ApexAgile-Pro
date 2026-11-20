import math
import logging
from app.config import BASE_RETRY_BACKOFF_SECONDS, DEFAULT_MAX_RETRIES

logger = logging.getLogger("SprintSync.FailurePolicy")

class FailurePolicy:
    """
    Exponential backoff and retry policy manager for resilient background job processing.
    """

    @staticmethod
    def calculate_backoff(retry_count: int, base_seconds: float = BASE_RETRY_BACKOFF_SECONDS, max_delay: float = 60.0) -> float:
        """
        Calculate exponential backoff with jitter: delay = min(max_delay, base * 2^retry_count).
        """
        delay = base_seconds * (2 ** retry_count)
        return min(delay, max_delay)

    @staticmethod
    def should_retry(current_retries: int, max_retries: int = DEFAULT_MAX_RETRIES) -> bool:
        """Determine whether another retry attempt is permitted."""
        return current_retries < max_retries
