"""Application-wide exception classes."""

from __future__ import annotations


class AppError(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class BadRequestError(AppError):
    """Raised when the request is malformed or invalid."""

    def __init__(self, message: str = "Bad request", code: str | None = None, details: dict | None = None):
        super().__init__(message, status_code=400)
        self.code = code or "BAD_REQUEST"
        self.details = details or {}


class UnauthorizedError(AppError):
    """Raised when authentication is required but not provided."""

    def __init__(self, message: str = "Unauthorized", code: str | None = None, details: dict | None = None):
        super().__init__(message, status_code=401)
        self.code = code or "UNAUTHORIZED"
        self.details = details or {}


class ForbiddenError(AppError):
    """Raised when the user doesn't have permission to access a resource."""

    def __init__(self, message: str = "Forbidden", code: str | None = None, details: dict | None = None):
        super().__init__(message, status_code=403)
        self.code = code or "FORBIDDEN"
        self.details = details or {}


class NotFoundError(AppError):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "Resource not found", code: str | None = None, details: dict | None = None):
        super().__init__(message, status_code=404)
        self.code = code or "NOT_FOUND"
        self.details = details or {}


class ConflictError(AppError):
    """Raised when there's a conflict with the current state."""

    def __init__(self, message: str = "Conflict", code: str | None = None, details: dict | None = None):
        super().__init__(message, status_code=409)
        self.code = code or "CONFLICT"
        self.details = details or {}


class UnprocessableEntityError(AppError):
    """Raised when the request is well-formed but semantically invalid."""

    def __init__(self, message: str = "Unprocessable entity", code: str | None = None, details: dict | None = None):
        super().__init__(message, status_code=422)
        self.code = code or "UNPROCESSABLE_ENTITY"
        self.details = details or {}


class InternalServerError(AppError):
    """Raised when an unexpected internal error occurs."""

    def __init__(self, message: str = "Internal server error", code: str | None = None, details: dict | None = None):
        super().__init__(message, status_code=500)
        self.code = code or "INTERNAL_SERVER_ERROR"
        self.details = details or {}
