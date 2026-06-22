import gc
import logging
from contextlib import suppress
from typing import Any

logger = logging.getLogger(__name__)


def release_memory(*objects: Any) -> None:
    """Drop model references and aggressively release Python, CUDA, and IPC caches."""
    for obj in objects:
        with suppress(Exception):
            del obj

    gc.collect()

    try:
        import torch

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
            torch.cuda.synchronize()
    except Exception as exc:
        logger.warning("CUDA cleanup completed with warning: %s", exc)

    gc.collect()
