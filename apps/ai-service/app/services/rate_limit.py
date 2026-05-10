from __future__ import annotations

import time
from collections import defaultdict


class SimpleRateLimiter:
    """Fixed-window limiter keyed by client id (e.g. IP). In-memory only (per process)."""

    def __init__(self, max_per_minute: int) -> None:
        self._max = max_per_minute
        self._hits: dict[str, list[float]] = defaultdict(list)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        window = self._hits[key]
        cutoff = now - 60.0
        while window and window[0] < cutoff:
            window.pop(0)
        if len(window) >= self._max:
            return False
        window.append(now)
        return True
