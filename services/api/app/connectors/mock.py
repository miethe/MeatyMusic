"""Mock connector for testing without external API calls.

Simulates a rendering engine with configurable behavior for testing.
"""

import asyncio
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .base import RenderConnector


class MockConnector(RenderConnector):
    """Mock rendering connector for testing.

    Simulates async job submission and completion without external API calls.
    Useful for testing workflow orchestration and error handling.

    Attributes:
        delay_seconds: Simulated processing delay (default: 2)
        fail_on_submit: If True, submission raises ConnectionError
        fail_on_status: If True, status check raises ConnectionError
    """

    def __init__(
        self,
        delay_seconds: float = 2.0,
        fail_on_submit: bool = False,
        fail_on_status: bool = False,
    ):
        """Initialize mock connector with configurable behavior.

        Args:
            delay_seconds: Seconds to wait before marking job as completed
            fail_on_submit: Simulate submission failure
            fail_on_status: Simulate status check failure
        """
        self.delay_seconds = delay_seconds
        self.fail_on_submit = fail_on_submit
        self.fail_on_status = fail_on_status
        self._jobs: dict[str, dict[str, Any]] = {}

    async def submit_job(
        self,
        prompt: dict[str, Any],
        model: str,
        num_variations: int,
        seed: int | None = None,
    ) -> dict[str, Any]:
        """Submit a mock render job.

        Args:
            prompt: Composed prompt dictionary
            model: Model identifier
            num_variations: Number of variations (1-3)
            seed: Optional seed (recorded but not used)

        Returns:
            Job submission result with job_id and status

        Raises:
            ConnectionError: If fail_on_submit is True
            ValueError: If invalid parameters
        """
        if self.fail_on_submit:
            raise ConnectionError("Mock submission failure")

        # Validate inputs
        self.validate_prompt(prompt, model)

        if not 1 <= num_variations <= 3:
            raise ValueError(f"num_variations must be 1-3, got {num_variations}")

        # Create job
        job_id = f"mock_{uuid4().hex[:8]}"
        created_at = datetime.now(timezone.utc)

        job = {
            "job_id": job_id,
            "status": "queued",
            "created_at": created_at.isoformat(),
            "model": model,
            "num_variations": num_variations,
            "seed": seed,
            "metadata": {
                "engine": "mock",
                "model": model,
                "duration_estimate": 180,  # 3 minutes
            },
        }

        self._jobs[job_id] = job

        # Schedule completion after delay
        asyncio.create_task(self._complete_job_after_delay(job_id))

        return {
            "job_id": job["job_id"],
            "status": job["status"],
            "created_at": job["created_at"],
            "metadata": job["metadata"],
        }

    async def _complete_job_after_delay(self, job_id: str) -> None:
        """Mark job as completed after delay.

        Args:
            job_id: Job to complete
        """
        await asyncio.sleep(self.delay_seconds)

        if job_id in self._jobs:
            self._jobs[job_id].update({
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "asset_uri": f"https://storage.example.com/mock/{job_id}.mp3",
            })

    async def get_status(self, job_id: str) -> dict[str, Any]:
        """Get status of a mock render job.

        Args:
            job_id: Job identifier

        Returns:
            Job status with asset_uri if completed

        Raises:
            ValueError: Unknown job_id
            ConnectionError: If fail_on_status is True
        """
        if self.fail_on_status:
            raise ConnectionError("Mock status check failure")

        if job_id not in self._jobs:
            raise ValueError(f"Unknown job_id: {job_id}")

        job = self._jobs[job_id]

        result = {
            "job_id": job["job_id"],
            "status": job["status"],
        }

        if "asset_uri" in job:
            result["asset_uri"] = job["asset_uri"]

        if "completed_at" in job:
            result["completed_at"] = job["completed_at"]

        if "metadata" in job:
            result["metadata"] = job["metadata"]

        return result

    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a mock render job.

        Args:
            job_id: Job identifier

        Returns:
            True if cancelled, False if already completed/failed

        Raises:
            ValueError: Unknown job_id
            ConnectionError: If fail_on_status is True (reuses flag)
        """
        if self.fail_on_status:
            raise ConnectionError("Mock cancellation failure")

        if job_id not in self._jobs:
            raise ValueError(f"Unknown job_id: {job_id}")

        job = self._jobs[job_id]

        if job["status"] in ("completed", "failed", "cancelled"):
            return False

        job["status"] = "cancelled"
        job["cancelled_at"] = datetime.now(timezone.utc).isoformat()

        return True

    def get_max_prompt_length(self, model: str) -> int:
        """Get maximum prompt length for mock models.

        Args:
            model: Model identifier

        Returns:
            3000 characters for all mock models

        Raises:
            ValueError: If model not in supported list
        """
        if model not in self.get_supported_models():
            raise ValueError(f"Unsupported model: {model}")

        return 3000

    def get_supported_models(self) -> list[str]:
        """Get list of mock model identifiers.

        Returns:
            List of mock model IDs
        """
        return ["mock-v1", "mock-v2", "mock-fast", "mock-hq"]

    def reset(self) -> None:
        """Reset mock connector state.

        Clears all tracked jobs. Useful between tests.
        """
        self._jobs.clear()
