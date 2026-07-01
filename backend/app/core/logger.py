import logging
import sys
import json


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
        }
        if hasattr(record, "request_path"):
            log_record["http_method"] = getattr(record, "http_method", "")
            log_record["request_path"] = getattr(record, "request_path", "")
            log_record["response_status"] = getattr(record, "response_status", "")
            log_record["response_time_ms"] = getattr(record, "response_time_ms", "")
        return json.dumps(log_record)


def setup_logger():
    logger = logging.getLogger("supportai")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
    return logger


logger = setup_logger()
