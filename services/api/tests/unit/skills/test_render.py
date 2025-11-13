"""Unit tests for RENDER workflow skill.

Tests feature flag handling, connector pattern, and error scenarios.
"""

import pytest

from app.skills.render import (
    submit_render,
    get_render_status,
    cancel_render_job,
    ConnectorFactory,
)
from app.connectors import MockConnector


@pytest.fixture
def sample_composed_prompt():
    """Create a sample composed prompt."""
    return {
        "final_prompt": "[Verse 1]\nTest lyrics here\n\n[Chorus]\nCatchy hook",
        "metadata": {
            "genre": "pop",
            "bpm": 120,
            "key": "C major",
        },
        "sections": [
            {"type": "verse", "start": 0, "end": 8},
            {"type": "chorus", "start": 8, "end": 16},
        ],
    }


@pytest.fixture(autouse=True)
def reset_connector_factory():
    """Reset connector factory state between tests."""
    # Store original connectors
    original = ConnectorFactory._connectors.copy()

    # Ensure mock connector is registered
    if "mock" not in ConnectorFactory._connectors:
        ConnectorFactory.register_connector("mock", MockConnector())

    yield

    # Restore original state
    ConnectorFactory._connectors = original


class TestSubmitRender:
    """Tests for submit_render function."""

    async def test_feature_flag_disabled(self, sample_composed_prompt):
        """Test that rendering is skipped when feature flag is disabled."""
        # Act
        result = await submit_render(
            engine="mock",
            model="mock-v1",
            composed_prompt=sample_composed_prompt,
            num_variations=1,
            seed=42,
            render_enabled=False,
        )

        # Assert
        assert result is None

    async def test_feature_flag_enabled(self, sample_composed_prompt):
        """Test successful submission when feature flag is enabled."""
        # Act
        result = await submit_render(
            engine="mock",
            model="mock-v1",
            composed_prompt=sample_composed_prompt,
            num_variations=2,
            seed=42,
            render_enabled=True,
        )

        # Assert
        assert result is not None
        assert "job_id" in result
        assert result["status"] == "queued"
        assert result["job_id"].startswith("mock_")

    async def test_invalid_engine(self, sample_composed_prompt):
        """Test error handling for unknown engine."""
        # Act & Assert
        with pytest.raises(ValueError, match="Unknown rendering engine"):
            await submit_render(
                engine="unknown-engine",
                model="some-model",
                composed_prompt=sample_composed_prompt,
                num_variations=1,
                seed=42,
                render_enabled=True,
            )

    async def test_invalid_num_variations(self, sample_composed_prompt):
        """Test validation of num_variations parameter."""
        # Act & Assert
        with pytest.raises(ValueError, match="num_variations must be 1-3"):
            await submit_render(
                engine="mock",
                model="mock-v1",
                composed_prompt=sample_composed_prompt,
                num_variations=5,  # Invalid
                seed=42,
                render_enabled=True,
            )

    async def test_prompt_too_long(self):
        """Test validation of prompt length."""
        # Arrange
        long_prompt = {
            "final_prompt": "A" * 5000,  # Exceeds mock limit of 3000
            "metadata": {},
            "sections": [],
        }

        # Act & Assert
        with pytest.raises(ValueError, match="Prompt exceeds mock-v1 limit"):
            await submit_render(
                engine="mock",
                model="mock-v1",
                composed_prompt=long_prompt,
                num_variations=1,
                seed=42,
                render_enabled=True,
            )

    async def test_unsupported_model(self, sample_composed_prompt):
        """Test validation of model parameter."""
        # Act & Assert
        with pytest.raises(ValueError, match="Unsupported model"):
            await submit_render(
                engine="mock",
                model="unsupported-model",
                composed_prompt=sample_composed_prompt,
                num_variations=1,
                seed=42,
                render_enabled=True,
            )

    async def test_connection_error(self, sample_composed_prompt):
        """Test handling of connection errors."""
        # Arrange
        failing_connector = MockConnector(fail_on_submit=True)
        ConnectorFactory.register_connector("failing-mock", failing_connector)

        # Act & Assert
        with pytest.raises(ConnectionError):
            await submit_render(
                engine="failing-mock",
                model="mock-v1",
                composed_prompt=sample_composed_prompt,
                num_variations=1,
                seed=42,
                render_enabled=True,
            )


class TestGetRenderStatus:
    """Tests for get_render_status function."""

    async def test_get_status_success(self):
        """Test successful status retrieval."""
        # Arrange
        connector = MockConnector()
        ConnectorFactory.register_connector("mock", connector)

        # Submit a job first
        job = await connector.submit_job(
            prompt={"final_prompt": "test"},
            model="mock-v1",
            num_variations=1,
        )
        job_id = job["job_id"]

        # Act
        status = await get_render_status(
            job_id=job_id,
            engine="mock",
        )

        # Assert
        assert status["job_id"] == job_id
        assert status["status"] in ("queued", "completed")

    async def test_get_status_unknown_job(self):
        """Test status check for unknown job_id."""
        # Act & Assert
        with pytest.raises(ValueError, match="Unknown job_id"):
            await get_render_status(
                job_id="unknown-job-id",
                engine="mock",
            )


class TestCancelRenderJob:
    """Tests for cancel_render_job function."""

    async def test_cancel_queued_job(self):
        """Test cancellation of queued job."""
        # Arrange
        connector = MockConnector(delay_seconds=10)  # Long delay
        ConnectorFactory.register_connector("mock", connector)

        # Submit a job
        job = await connector.submit_job(
            prompt={"final_prompt": "test"},
            model="mock-v1",
            num_variations=1,
        )
        job_id = job["job_id"]

        # Act
        cancelled = await cancel_render_job(
            job_id=job_id,
            engine="mock",
        )

        # Assert
        assert cancelled is True

    async def test_cancel_unknown_job(self):
        """Test cancellation of unknown job."""
        # Act & Assert
        with pytest.raises(ValueError, match="Unknown job_id"):
            await cancel_render_job(
                job_id="unknown-job-id",
                engine="mock",
            )


class TestConnectorFactory:
    """Tests for ConnectorFactory."""

    def test_register_and_get_connector(self):
        """Test connector registration and retrieval."""
        # Arrange
        connector = MockConnector()

        # Act
        ConnectorFactory.register_connector("test-engine", connector)
        retrieved = ConnectorFactory.get_connector("test-engine")

        # Assert
        assert retrieved is connector

    def test_get_unknown_connector(self):
        """Test error for unknown connector."""
        # Act & Assert
        with pytest.raises(ValueError, match="Unknown rendering engine"):
            ConnectorFactory.get_connector("nonexistent-engine")

    def test_get_supported_engines(self):
        """Test retrieval of supported engines."""
        # Arrange
        ConnectorFactory.register_connector("engine1", MockConnector())
        ConnectorFactory.register_connector("engine2", MockConnector())

        # Act
        engines = ConnectorFactory.get_supported_engines()

        # Assert
        assert "engine1" in engines
        assert "engine2" in engines
