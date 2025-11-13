"""LLM client for workflow skills.

Provides a simple wrapper around Anthropic's Claude API for deterministic
text generation with seed control.
"""

import os
from typing import Any, Dict, Optional

import structlog

logger = structlog.get_logger(__name__)

# Lazy import to allow tests to mock
_anthropic_client = None


def _get_anthropic_client():
    """Get or create Anthropic client."""
    global _anthropic_client
    if _anthropic_client is None:
        from anthropic import Anthropic
        _anthropic_client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    return _anthropic_client


class LLMClient:
    """Client for deterministic LLM generation."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize LLM client.

        Args:
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
        """
        if api_key:
            from anthropic import Anthropic
            self.client = Anthropic(api_key=api_key)
        else:
            self.client = None  # Will be lazy-loaded
        self.model = "claude-sonnet-4-5-20250929"  # Latest Sonnet model

    async def generate(
        self,
        system: str,
        user_prompt: str,
        temperature: float = 0.2,
        top_p: float = 0.9,
        max_tokens: int = 4000,
        seed: Optional[int] = None,
    ) -> str:
        """Generate text with deterministic parameters.

        Args:
            system: System prompt defining the task
            user_prompt: User message with input data
            temperature: Sampling temperature (0.0-1.0)
            top_p: Nucleus sampling parameter
            max_tokens: Maximum tokens to generate
            seed: Random seed for determinism

        Returns:
            Generated text string
        """
        try:
            # Lazy-load client if not provided
            if self.client is None:
                self.client = _get_anthropic_client()

            # Build request params
            params: Dict[str, Any] = {
                "model": self.model,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "system": system,
                "messages": [{"role": "user", "content": user_prompt}],
            }

            # Add seed if provided (for determinism)
            if seed is not None:
                params["seed"] = seed

            logger.info(
                "llm.generate.request",
                model=self.model,
                temperature=temperature,
                top_p=top_p,
                seed=seed,
                system_length=len(system),
                prompt_length=len(user_prompt),
            )

            # Make synchronous API call (Anthropic SDK is sync)
            response = self.client.messages.create(**params)

            # Extract text from response
            text = response.content[0].text

            logger.info(
                "llm.generate.response",
                response_length=len(text),
                usage=response.usage.model_dump() if response.usage else {},
            )

            return text

        except Exception as e:
            logger.error(
                "llm.generate.error",
                error=str(e),
                error_type=type(e).__name__,
            )
            raise


# Global client instance
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get or create global LLM client instance."""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client
