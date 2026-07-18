import time
from typing import Dict, Tuple

class MetricsCollector:
    """A lightweight, dependency-free in-memory Prometheus metrics registry.

    Tracks HTTP request counts, status codes, and durations.
    """
    def __init__(self):
        self._request_counter: Dict[Tuple[str, str, int], int] = {}
        self._request_durations: Dict[Tuple[str, str], float] = {}
        self._active_requests: int = 0

    def increment_request(self, method: str, path: str, status_code: int) -> None:
        key = (method, path, status_code)
        self._request_counter[key] = self._request_counter.get(key, 0) + 1

    def observe_duration(self, method: str, path: str, duration_sec: float) -> None:
        key = (method, path)
        # Store moving average or total sum + count if we wanted histograms.
        # For simplicity, we track total duration sum and compute avg in-app
        # or expose aggregate counters.
        current = self._request_durations.get(key, (0.0, 0))
        self._request_durations[key] = (current[0] + duration_sec, current[1] + 1)

    def increment_active(self) -> None:
        self._active_requests += 1

    def decrement_active(self) -> None:
        self._active_requests = max(0, self._active_requests - 1)

    def generate_prometheus_metrics(self) -> str:
        """Generates Prometheus text exposition format."""
        lines = []

        # active requests
        lines.append("# HELP tracemind_active_requests Current active requests on server")
        lines.append("# TYPE tracemind_active_requests gauge")
        lines.append(f"tracemind_active_requests {self._active_requests}")

        # request counts
        lines.append("# HELP tracemind_http_requests_total Total count of HTTP requests processed")
        lines.append("# TYPE tracemind_http_requests_total counter")
        for (method, path, status), count in self._request_counter.items():
            lines.append(
                f'tracemind_http_requests_total{{method="{method}",path="{path}",status="{status}"}} {count}'
            )

        # request durations
        lines.append("# HELP tracemind_http_request_duration_seconds_sum Sum of request durations in seconds")
        lines.append("# TYPE tracemind_http_request_duration_seconds_sum counter")
        for (method, path), (duration_sum, _) in self._request_durations.items():
            lines.append(
                f'tracemind_http_request_duration_seconds_sum{{method="{method}",path="{path}"}} {duration_sum:.6f}'
            )

        lines.append("# HELP tracemind_http_request_duration_seconds_count Count of request durations in seconds")
        lines.append("# TYPE tracemind_http_request_duration_seconds_count counter")
        for (method, path), (_, duration_count) in self._request_durations.items():
            lines.append(
                f'tracemind_http_request_duration_seconds_count{{method="{method}",path="{path}"}} {duration_count}'
            )

        return "\n".join(lines) + "\n"

# Singleton collector
metrics_collector = MetricsCollector()
