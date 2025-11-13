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

    def __init__(self, message: str = "Bad request"):
        super().__init__(message, status_code=400)


class UnauthorizedError(AppError):
    """Raised when authentication is required but not provided."""

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=401)


class ForbiddenError(AppError):
    """Raised when the user doesn't have permission to access a resource."""

    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status_code=403)


class NotFoundError(AppError):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class ConflictError(AppError):
    """Raised when there's a conflict with the current state."""

    def __init__(self, message: str = "Conflict"):
        super().__init__(message, status_code=409)


class UnprocessableEntityError(AppError):
    """Raised when the request is well-formed but semantically invalid."""

    def __init__(self, message: str = "Unprocessable entity"):
        super().__init__(message, status_code=422)


class InternalServerError(AppError):
    """Raised when an unexpected internal error occurs."""

    def __init__(self, message: str = "Internal server error"):
        super().__init__(message, status_code=500)
