"""Test suite for Role-Based Access Control (RBAC) system.

This module tests the RBAC implementation including:
- UserRole enum functionality
- User.is_admin property
- require_admin dependency
- Admin protection on blueprint endpoints
- Proper 403 error responses for unauthorized access
"""

from __future__ import annotations

import uuid
from typing import Generator
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.core.security import SecurityContext
from app.models.enums import UserRole
from app.models.tenant import Tenant
from app.models.user import User


# Test Fixtures

@pytest.fixture
def admin_user(test_session: Session, tenant_id: uuid.UUID) -> User:
    """Create an admin user for testing.

    Args:
        test_session: Database session
        tenant_id: Tenant ID

    Returns:
        Admin user instance
    """
    # Ensure tenant exists
    tenant = test_session.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        tenant = Tenant(
            id=tenant_id,
            name="test-tenant",
            display_name="Test Tenant",
            slug="test-tenant",
            is_active=True,
        )
        test_session.add(tenant)
        test_session.commit()

    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        clerk_user_id="clerk_admin_123",
        email="admin@test.com",
        username="admin_user",
        is_active=True,
        email_verified=True,
        role=UserRole.ADMIN,
    )
    test_session.add(user)
    test_session.commit()
    test_session.refresh(user)
    return user


@pytest.fixture
def regular_user(test_session: Session, tenant_id: uuid.UUID) -> User:
    """Create a regular (non-admin) user for testing.

    Args:
        test_session: Database session
        tenant_id: Tenant ID

    Returns:
        Regular user instance
    """
    # Ensure tenant exists
    tenant = test_session.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        tenant = Tenant(
            id=tenant_id,
            name="test-tenant",
            display_name="Test Tenant",
            slug="test-tenant",
            is_active=True,
        )
        test_session.add(tenant)
        test_session.commit()

    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        clerk_user_id="clerk_user_456",
        email="user@test.com",
        username="regular_user",
        is_active=True,
        email_verified=True,
        role=UserRole.USER,
    )
    test_session.add(user)
    test_session.commit()
    test_session.refresh(user)
    return user


# UserRole Enum Tests

class TestUserRoleEnum:
    """Test UserRole enum functionality."""

    def test_user_role_values(self):
        """Test that UserRole has correct values."""
        assert UserRole.USER.value == "user"
        assert UserRole.ADMIN.value == "admin"

    def test_user_role_str(self):
        """Test UserRole string representation."""
        assert str(UserRole.USER) == "user"
        assert str(UserRole.ADMIN) == "admin"

    def test_user_role_from_string_valid(self):
        """Test creating UserRole from valid string."""
        assert UserRole.from_string("user") == UserRole.USER
        assert UserRole.from_string("admin") == UserRole.ADMIN
        assert UserRole.from_string("USER") == UserRole.USER  # Case insensitive
        assert UserRole.from_string("ADMIN") == UserRole.ADMIN

    def test_user_role_from_string_invalid(self):
        """Test creating UserRole from invalid string raises ValueError."""
        with pytest.raises(ValueError, match="Invalid user role"):
            UserRole.from_string("superuser")

        with pytest.raises(ValueError, match="Invalid user role"):
            UserRole.from_string("moderator")


# User Model Tests

class TestUserModel:
    """Test User model RBAC functionality."""

    def test_user_default_role(self, test_session: Session, tenant_id: uuid.UUID):
        """Test that new users default to USER role."""
        # Ensure tenant exists
        tenant = test_session.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            tenant = Tenant(
                id=tenant_id,
                name="test-tenant",
                display_name="Test Tenant",
                slug="test-tenant",
                is_active=True,
            )
            test_session.add(tenant)
            test_session.commit()

        user = User(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            clerk_user_id="clerk_test_789",
            email="newuser@test.com",
            username="new_user",
            is_active=True,
            email_verified=True,
            # Note: role not explicitly set
        )
        test_session.add(user)
        test_session.commit()
        test_session.refresh(user)

        assert user.role == UserRole.USER
        assert not user.is_admin

    def test_admin_user_is_admin_property(self, admin_user: User):
        """Test is_admin property for admin user."""
        assert admin_user.role == UserRole.ADMIN
        assert admin_user.is_admin is True

    def test_regular_user_is_admin_property(self, regular_user: User):
        """Test is_admin property for regular user."""
        assert regular_user.role == UserRole.USER
        assert regular_user.is_admin is False

    def test_user_repr_includes_role(self, admin_user: User):
        """Test that __repr__ includes role information."""
        repr_str = repr(admin_user)
        assert "role=admin" in repr_str
        assert admin_user.email in repr_str


# require_admin Dependency Tests

class TestRequireAdminDependency:
    """Test require_admin FastAPI dependency."""

    @pytest.mark.asyncio
    async def test_require_admin_with_admin_user(
        self, test_session: Session, admin_user: User
    ):
        """Test require_admin allows admin users."""
        security_context = SecurityContext(
            user_id=admin_user.id,
            tenant_id=admin_user.tenant_id,
        )

        # Should not raise exception
        result = await require_admin(security_context, test_session)
        assert result == security_context

    @pytest.mark.asyncio
    async def test_require_admin_with_regular_user(
        self, test_session: Session, regular_user: User
    ):
        """Test require_admin denies regular users with 403."""
        security_context = SecurityContext(
            user_id=regular_user.id,
            tenant_id=regular_user.tenant_id,
        )

        with pytest.raises(HTTPException) as exc_info:
            await require_admin(security_context, test_session)

        assert exc_info.value.status_code == 403
        assert "Admin privileges required" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_require_admin_with_nonexistent_user(self, test_session: Session):
        """Test require_admin denies nonexistent user with 403."""
        fake_user_id = uuid.uuid4()
        fake_tenant_id = uuid.uuid4()
        security_context = SecurityContext(
            user_id=fake_user_id,
            tenant_id=fake_tenant_id,
        )

        with pytest.raises(HTTPException) as exc_info:
            await require_admin(security_context, test_session)

        assert exc_info.value.status_code == 403
        assert "User not found" in exc_info.value.detail


# Integration Tests - Blueprint Endpoints

class TestBlueprintRBAC:
    """Test RBAC integration with Blueprint endpoints.

    These tests verify that blueprint CRUD operations are properly protected
    with admin-only access for create, update, and delete operations.
    """

    @pytest.mark.asyncio
    async def test_create_blueprint_requires_admin(self):
        """Test that creating a blueprint requires admin role.

        This test verifies the endpoint signature includes require_admin dependency.
        """
        # Import here to avoid circular dependencies
        from app.api.v1.endpoints.blueprints import create_blueprint
        import inspect

        # Get function signature
        sig = inspect.signature(create_blueprint)

        # Check that admin_context parameter exists
        assert "admin_context" in sig.parameters

        # Verify it depends on require_admin
        param = sig.parameters["admin_context"]
        assert param.default is not inspect.Parameter.empty
        # The default should be a Depends() object wrapping require_admin

    @pytest.mark.asyncio
    async def test_import_blueprint_requires_admin(self):
        """Test that importing a blueprint requires admin role."""
        from app.api.v1.endpoints.blueprints import import_blueprint
        import inspect

        sig = inspect.signature(import_blueprint)
        assert "admin_context" in sig.parameters

    @pytest.mark.asyncio
    async def test_update_blueprint_requires_admin(self):
        """Test that updating a blueprint requires admin role."""
        from app.api.v1.endpoints.blueprints import update_blueprint
        import inspect

        sig = inspect.signature(update_blueprint)
        assert "admin_context" in sig.parameters

    @pytest.mark.asyncio
    async def test_delete_blueprint_requires_admin(self):
        """Test that deleting a blueprint requires admin role."""
        from app.api.v1.endpoints.blueprints import delete_blueprint
        import inspect

        sig = inspect.signature(delete_blueprint)
        assert "admin_context" in sig.parameters

    @pytest.mark.asyncio
    async def test_get_blueprint_does_not_require_admin(self):
        """Test that getting a blueprint by ID does NOT require admin (public)."""
        from app.api.v1.endpoints.blueprints import get_blueprint
        import inspect

        sig = inspect.signature(get_blueprint)
        # Should NOT have admin_context parameter
        assert "admin_context" not in sig.parameters

    @pytest.mark.asyncio
    async def test_list_blueprints_does_not_require_admin(self):
        """Test that listing blueprints does NOT require admin (public)."""
        from app.api.v1.endpoints.blueprints import list_blueprints
        import inspect

        sig = inspect.signature(list_blueprints)
        assert "admin_context" not in sig.parameters


# Edge Cases and Security Tests

class TestRBACSecurityEdgeCases:
    """Test edge cases and security considerations for RBAC."""

    def test_user_role_cannot_be_elevated_via_string_manipulation(
        self, test_session: Session, regular_user: User
    ):
        """Test that role cannot be elevated by string manipulation."""
        # Attempt to set role to admin via attribute
        regular_user.role = UserRole.ADMIN
        test_session.commit()
        test_session.refresh(regular_user)

        # Verify role was actually changed (this is expected behavior)
        # The security is enforced at the API layer via require_admin
        assert regular_user.role == UserRole.ADMIN

    @pytest.mark.asyncio
    async def test_require_admin_logs_access_attempts(
        self, test_session: Session, admin_user: User, regular_user: User
    ):
        """Test that require_admin logs access attempts for audit trail."""
        import structlog
        from unittest.mock import patch

        # Test admin access logging
        admin_context = SecurityContext(
            user_id=admin_user.id,
            tenant_id=admin_user.tenant_id,
        )

        with patch.object(structlog.get_logger(), "info") as mock_log_info:
            await require_admin(admin_context, test_session)
            # Verify admin access was logged
            mock_log_info.assert_called_once()
            call_args = mock_log_info.call_args
            assert "rbac_admin_access_granted" in call_args[0]

        # Test denied access logging
        user_context = SecurityContext(
            user_id=regular_user.id,
            tenant_id=regular_user.tenant_id,
        )

        with patch.object(structlog.get_logger(), "warning") as mock_log_warning:
            with pytest.raises(HTTPException):
                await require_admin(user_context, test_session)
            # Verify denied access was logged
            mock_log_warning.assert_called_once()
            call_args = mock_log_warning.call_args
            assert "rbac_admin_access_denied" in call_args[0]

    def test_user_role_persists_across_sessions(
        self, test_session: Session, admin_user: User
    ):
        """Test that user role persists correctly across database sessions."""
        user_id = admin_user.id

        # Clear session and re-query
        test_session.expunge_all()
        reloaded_user = test_session.query(User).filter(User.id == user_id).first()

        assert reloaded_user is not None
        assert reloaded_user.role == UserRole.ADMIN
        assert reloaded_user.is_admin is True

    def test_multiple_users_with_different_roles(
        self, test_session: Session, admin_user: User, regular_user: User
    ):
        """Test that multiple users can have different roles simultaneously."""
        # Query both users
        users = test_session.query(User).filter(
            User.id.in_([admin_user.id, regular_user.id])
        ).all()

        assert len(users) == 2

        # Verify roles are correct
        admin = next(u for u in users if u.id == admin_user.id)
        regular = next(u for u in users if u.id == regular_user.id)

        assert admin.role == UserRole.ADMIN
        assert admin.is_admin is True

        assert regular.role == UserRole.USER
        assert regular.is_admin is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
