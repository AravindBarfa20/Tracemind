import json
import logging
import sys
import time
from typing import Any, Dict

class JSONFormatter(logging.Formatter):
    """Formats log records as single-line JSON objects."""
    
    def __init__(self, service_name: str = "tracemind-backend"):
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "service": self.service_name,
            "logger": record.name,
            "file": f"{record.pathname}:{record.lineno}",
        }

        # Include request context if present
        request_id = getattr(record, "request_id", None)
        if request_id:
            log_data["request_id"] = request_id

        # Include exception traceback if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Include extra custom dict properties passed to the log call
        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)

        return json.dumps(log_data)


class RequestContextFilter(logging.Filter):
    """Thread-local or contextvar filter to auto-inject request_id into logs (if we want to use contextvars).

    For now, we inject request_id explicitly via middlewares or filters.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        # Make sure request_id is always present as an attribute
        if not hasattr(record, "request_id"):
            record.request_id = None
        return True


def setup_logging(debug: bool = False) -> None:
    """Configures system-wide logging."""
    log_level = logging.DEBUG if debug else logging.INFO

    # Root Logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Clean existing handlers
    root_logger.handlers.clear()

    # Handler for stdout
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    # Use JSON formatting in production / development non-debug mode, otherwise clean readable formatting
    if not debug:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s (%(pathname)s:%(lineno)d)",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

    console_handler.setFormatter(formatter)
    console_handler.addFilter(RequestContextFilter())
    root_logger.addHandler(console_handler)

    # Mute noisy logs slightly
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
