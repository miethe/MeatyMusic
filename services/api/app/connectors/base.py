"""Abstract base class for render connectors.

Defines the interface that all rendering engine connectors must implement.
Supports pluggable backends (Suno, Stable Audio, MusicGen, etc.).
"""

from abc import ABC, abstractmethod
from typing import Any


class RenderConnector(ABC):
    """Abstract interface for music rendering engines.

    Each connector implements submission, status checking, and cancellation
    for a specific rendering backend (e.g., Suno, Stable Audio).

    Example:
        ```python
        class SunoConnector(RenderConnector):
            async def submit_job(self, prompt, model, num_variations):
                response = await self.client.post("/generate", ...)
                return {"job_id": response["id"], "status": "queued"}
        ```
    """

    @abstractmethod
    async def submit_job(
        self,
        prompt: dict[str, Any],
        model: str,
        num_variations: int,
        seed: int | None = None,
    ) -> dict[str, Any]:
        """Submit a render job to the engine.

        Args:
            prompt: Composed prompt dictionary (from ComposedPromptSchema)
            model: Model/version identifier (e.g., "suno-v3.5")
            num_variations: Number of variations to generate (1-3)
            seed: Optional seed for reproducibility (if supported)

        Returns:
            Dictionary with:
                - job_id (str): Unique job identifier
                - status (str): "queued" | "processing" | "completed" | "failed"
                - created_at (str): ISO 8601 timestamp
                - asset_uri (str, optional): URI if sync completion
                - metadata (dict, optional): Engine-specific metadata

        Raises:
            ValueError: Invalid parameters (prompt too long, invalid model, etc.)
            ConnectionError: Network or API errors
            RateLimitError: Rate limit exceeded
        """
        pass

    @abstractmethod
    async def get_status(self, job_id: str) -> dict[str, Any]:
        """Check the status of a render job.

        Args:
            job_id: Job identifier returned from submit_job()

        Returns:
            Dictionary with:
                - job_id (str): Job identifier
                - status (str): "queued" | "processing" | "completed" | "failed"
                - asset_uri (str, optional): URI when completed
                - completed_at (str, optional): ISO 8601 timestamp when done
                - error (str, optional): Error message if failed
                - metadata (dict, optional): Additional info

        Raises:
            ValueError: Unknown job_id
            ConnectionError: Network or API errors
        """
        pass

    @abstractmethod
    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a pending render job.

        Args:
            job_id: Job identifier to cancel

        Returns:
            True if cancelled successfully, False if already completed/failed

        Raises:
            ValueError: Unknown job_id
            ConnectionError: Network or API errors
        """
        pass

    @abstractmethod
    def get_max_prompt_length(self, model: str) -> int:
        """Get maximum prompt length for a model.

        Args:
            model: Model identifier

        Returns:
            Maximum character count for prompts

        Raises:
            ValueError: Unknown model
        """
        pass

    @abstractmethod
    def get_supported_models(self) -> list[str]:
        """Get list of supported model identifiers.

        Returns:
            List of model IDs (e.g., ["suno-v3", "suno-v3.5"])
        """
        pass

    def validate_prompt(self, prompt: dict[str, Any], model: str) -> None:
        """Validate prompt against engine constraints.

        Args:
            prompt: Composed prompt dictionary
            model: Model identifier

        Raises:
            ValueError: Prompt violates engine constraints
        """
        final_prompt = prompt.get("final_prompt", "")
        max_length = self.get_max_prompt_length(model)

        if len(final_prompt) > max_length:
            raise ValueError(
                f"Prompt exceeds {model} limit: {len(final_prompt)} > {max_length}"
            )

        if model not in self.get_supported_models():
            supported = ", ".join(self.get_supported_models())
            raise ValueError(
                f"Unsupported model '{model}'. Supported: {supported}"
            )
