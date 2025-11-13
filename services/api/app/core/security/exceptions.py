"""Security-related exceptions for the UnifiedRowGuard system."""

from __future__ import annotations


class SecurityContextError(Exception):
    """Raised when security context is missing or incomplete."""

    def __init__(self, message: str, context_type: str | None = None):
        super().__init__(message)
        self.context_type = context_type
        self.message = message


class UnsupportedTableError(Exception):
    """Raised when attempting to apply security to an unsupported table."""

    def __init__(self, table_name: str, message: str | None = None):
        self.table_name = table_name
        default_message = f"Table '{table_name}' is not supported by UnifiedRowGuard"
        super().__init__(message or default_message)


class SecurityFilterError(Exception):
    """Raised when security filter application fails."""

    def __init__(self, message: str, table_pattern: str | None = None):
        super().__init__(message)
        self.table_pattern = table_pattern
        self.message = message
