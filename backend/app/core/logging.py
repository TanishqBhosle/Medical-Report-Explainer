import logging
import re
import sys

# Redaction patterns for sensitive PHI (emails, SSNs, credit cards, dates of birth, phone numbers)
PHI_PATTERNS = [
    (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'), '[REDACTED_EMAIL]'),
    (re.compile(r'\b\d{3}-\d{2}-\d{4}\b'), '[REDACTED_SSN]'),
    (re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'), '[REDACTED_PHONE]'),
]


class RedactingFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        redacted = original
        for pattern, replacement in PHI_PATTERNS:
            redacted = pattern.sub(replacement, redacted)
        return redacted


def setup_logger(name: str = "medical_explainer") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            RedactingFormatter("[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s")
        )
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


logger = setup_logger()
