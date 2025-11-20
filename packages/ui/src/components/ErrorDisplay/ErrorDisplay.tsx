import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, XCircle, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../Button/Button";

const errorDisplayVariants = cva(
  "flex flex-col rounded-lg border",
  {
    variants: {
      variant: {
        inline: "p-3 text-sm",
        panel: "p-4",
        "full-page": "min-h-[400px] p-8 items-center justify-center text-center",
      },
    },
    defaultVariants: {
      variant: "panel",
    },
  }
);

/**
 * ErrorResponse type matching backend API error envelope
 */
export interface ErrorResponse {
  code?: string;
  message: string;
  details?: Record<string, any> | string;
  request_id?: string;
}

export interface ErrorDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorDisplayVariants> {
  /** Error object - can be standard Error or ErrorResponse from backend */
  error: Error | ErrorResponse;
  /** Optional retry callback */
  retry?: () => void;
  /** Optional dismiss callback */
  onDismiss?: () => void;
  /** Show error details (request_id, code) */
  showDetails?: boolean;
}

/**
 * Utility to check if error is ErrorResponse
 */
function isErrorResponse(error: Error | ErrorResponse): error is ErrorResponse {
  return "code" in error || "request_id" in error;
}

/**
 * Utility to extract user-friendly message from error
 */
function getErrorMessage(error: Error | ErrorResponse): string {
  if (isErrorResponse(error)) {
    return error.message || "An unexpected error occurred";
  }
  return error.message || "An unexpected error occurred";
}

/**
 * Utility to extract error code
 */
function getErrorCode(error: Error | ErrorResponse): string | undefined {
  if (isErrorResponse(error)) {
    return error.code;
  }
  return undefined;
}

/**
 * Utility to extract request ID
 */
function getRequestId(error: Error | ErrorResponse): string | undefined {
  if (isErrorResponse(error)) {
    return error.request_id;
  }
  return undefined;
}

/**
 * ErrorDisplay component for consistent error UI across the application.
 *
 * Supports:
 * - Standard JavaScript Error objects
 * - Backend ErrorResponse envelope
 * - Retry functionality
 * - Dismiss functionality
 * - Multiple display variants
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   error={error}
 *   variant="panel"
 *   retry={() => refetch()}
 *   onDismiss={() => clearError()}
 *   showDetails
 * />
 * ```
 */
const ErrorDisplay = React.forwardRef<HTMLDivElement, ErrorDisplayProps>(
  (
    {
      className,
      variant = "panel",
      error,
      retry,
      onDismiss,
      showDetails = false,
      ...props
    },
    ref
  ) => {
    const message = getErrorMessage(error);
    const code = getErrorCode(error);
    const requestId = getRequestId(error);
    const isFullPage = variant === "full-page";
    const isInline = variant === "inline";

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(
          errorDisplayVariants({ variant }),
          "bg-danger/5 border-danger/20 text-danger",
          className
        )}
        {...props}
      >
        {/* Icon and Message Section */}
        <div className={cn(
          "flex items-start gap-3",
          isFullPage && "flex-col items-center"
        )}>
          {isFullPage ? (
            <XCircle className="h-12 w-12 flex-shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className={cn(
              "flex-shrink-0",
              isInline ? "h-4 w-4" : "h-5 w-5"
            )} aria-hidden="true" />
          )}

          <div className={cn(
            "flex-1",
            isFullPage && "text-center max-w-md"
          )}>
            <p className={cn(
              "font-medium",
              isFullPage && "text-lg mb-2",
              isInline && "text-sm"
            )}>
              {message}
            </p>

            {/* Error Details */}
            {showDetails && (code || requestId) && (
              <div className={cn(
                "mt-2 text-xs text-danger/80 space-y-1",
                isFullPage && "text-center"
              )}>
                {code && (
                  <p>
                    <span className="font-medium">Error Code:</span> {code}
                  </p>
                )}
                {requestId && (
                  <p>
                    <span className="font-medium">Request ID:</span>{" "}
                    <code className="bg-danger/10 px-1 py-0.5 rounded">
                      {requestId}
                    </code>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dismiss Button (inline/panel only) */}
          {onDismiss && !isFullPage && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-danger/80 hover:text-danger transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        {(retry || (onDismiss && isFullPage)) && (
          <div className={cn(
            "flex gap-2",
            isFullPage ? "mt-6 justify-center" : "mt-3 justify-end",
            isInline && "mt-2"
          )}>
            {retry && (
              <Button
                variant="outline"
                size={isInline ? "sm" : "md"}
                onClick={retry}
              >
                Try Again
              </Button>
            )}
            {onDismiss && isFullPage && (
              <Button
                variant="ghost"
                size={isInline ? "sm" : "md"}
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

ErrorDisplay.displayName = "ErrorDisplay";

export { ErrorDisplay };
