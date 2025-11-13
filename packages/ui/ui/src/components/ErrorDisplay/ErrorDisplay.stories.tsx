import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorDisplay, type ErrorResponse } from "./ErrorDisplay";

const meta: Meta<typeof ErrorDisplay> = {
  title: "Components/ErrorDisplay",
  component: ErrorDisplay,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "ErrorDisplay component for consistent error UI across the application. Supports standard JavaScript Error objects and backend ErrorResponse envelope format.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["inline", "panel", "full-page"],
      description: "Display variant",
    },
    showDetails: {
      control: "boolean",
      description: "Show error code and request ID",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorDisplay>;

// Sample errors for stories
const standardError = new Error("Failed to load data. Please try again.");

const backendError: ErrorResponse = {
  code: "NOT_FOUND",
  message: "The requested prompt could not be found",
  request_id: "req_abc123xyz789",
};

const networkError: ErrorResponse = {
  code: "NETWORK_ERROR",
  message: "Unable to connect to the server. Check your internet connection.",
  request_id: "req_xyz987def456",
};

const validationError: ErrorResponse = {
  code: "VALIDATION_ERROR",
  message: "Invalid input provided",
  details: {
    title: "Title is required",
    body: "Body must be at least 10 characters",
  },
  request_id: "req_validation_001",
};

/**
 * Inline variant for compact error display
 */
export const Inline: Story = {
  args: {
    error: standardError,
    variant: "inline",
  },
};

/**
 * Inline with retry button
 */
export const InlineWithRetry: Story = {
  args: {
    error: standardError,
    variant: "inline",
    retry: () => alert("Retry clicked"),
  },
};

/**
 * Inline with dismiss
 */
export const InlineWithDismiss: Story = {
  args: {
    error: standardError,
    variant: "inline",
    onDismiss: () => alert("Dismissed"),
  },
};

/**
 * Panel variant (default)
 */
export const Panel: Story = {
  args: {
    error: backendError,
    variant: "panel",
  },
};

/**
 * Panel with retry and dismiss
 */
export const PanelWithActions: Story = {
  args: {
    error: networkError,
    variant: "panel",
    retry: () => alert("Retry clicked"),
    onDismiss: () => alert("Dismissed"),
  },
};

/**
 * Panel with error details visible
 */
export const PanelWithDetails: Story = {
  args: {
    error: backendError,
    variant: "panel",
    showDetails: true,
    retry: () => alert("Retry clicked"),
  },
};

/**
 * Full-page variant for critical errors
 */
export const FullPage: Story = {
  args: {
    error: networkError,
    variant: "full-page",
  },
  parameters: {
    layout: "fullscreen",
  },
};

/**
 * Full-page with retry
 */
export const FullPageWithRetry: Story = {
  args: {
    error: new Error("Failed to load application. Please refresh the page."),
    variant: "full-page",
    retry: () => alert("Retry clicked"),
    onDismiss: () => alert("Dismissed"),
  },
  parameters: {
    layout: "fullscreen",
  },
};

/**
 * Full-page with error details
 */
export const FullPageWithDetails: Story = {
  args: {
    error: backendError,
    variant: "full-page",
    showDetails: true,
    retry: () => alert("Retry clicked"),
  },
  parameters: {
    layout: "fullscreen",
  },
};

/**
 * Backend API error with ErrorResponse envelope
 */
export const BackendAPIError: Story = {
  args: {
    error: backendError,
    variant: "panel",
    showDetails: true,
    retry: () => alert("Retry API call"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates error handling for backend API responses using the ErrorResponse envelope format. Shows error code and request ID for debugging.",
      },
    },
  },
};

/**
 * Network connection error
 */
export const NetworkConnectionError: Story = {
  args: {
    error: networkError,
    variant: "panel",
    showDetails: true,
    retry: () => alert("Retry connection"),
  },
};

/**
 * Validation error
 */
export const ValidationError: Story = {
  args: {
    error: validationError,
    variant: "panel",
    showDetails: true,
  },
};

/**
 * Not found error
 */
export const NotFoundError: Story = {
  args: {
    error: {
      code: "NOT_FOUND",
      message: "Page not found",
      request_id: "req_404_notfound",
    } as ErrorResponse,
    variant: "panel",
    showDetails: true,
  },
};

/**
 * Unauthorized error
 */
export const UnauthorizedError: Story = {
  args: {
    error: {
      code: "UNAUTHORIZED",
      message: "You don't have permission to access this resource",
      request_id: "req_401_unauthorized",
    } as ErrorResponse,
    variant: "panel",
    showDetails: true,
    retry: () => alert("Sign in"),
  },
};

/**
 * Server error
 */
export const ServerError: Story = {
  args: {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred on our servers. Our team has been notified.",
      request_id: "req_500_server_error",
    } as ErrorResponse,
    variant: "panel",
    showDetails: true,
    retry: () => alert("Retry request"),
  },
};

/**
 * Standard JavaScript Error
 */
export const StandardJSError: Story = {
  args: {
    error: new Error("Something went wrong"),
    variant: "panel",
    retry: () => alert("Retry"),
  },
};

/**
 * Error without retry or dismiss
 */
export const ReadOnlyError: Story = {
  args: {
    error: new Error("This is a permanent error that cannot be retried"),
    variant: "panel",
    showDetails: true,
  },
};

/**
 * Accessibility Demo - Screen Reader Friendly
 */
export const AccessibilityDemo: Story = {
  args: {
    error: backendError,
    variant: "panel",
    showDetails: true,
    retry: () => alert("Retry clicked"),
    onDismiss: () => alert("Dismissed"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "This story demonstrates accessibility features:\n\n" +
          "- `role=\"alert\"` for error announcements\n" +
          "- `aria-live=\"assertive\"` for immediate screen reader announcements\n" +
          "- `aria-label` on dismiss button\n" +
          "- `aria-hidden=\"true\"` on decorative icon\n" +
          "- Keyboard accessible buttons\n" +
          "- High contrast error styling\n\n" +
          "**Testing with Screen Readers:**\n" +
          "- VoiceOver (macOS): Should immediately announce the error\n" +
          "- NVDA (Windows): Should interrupt and announce the error\n" +
          "- JAWS: Should announce error content\n\n" +
          "**Keyboard Navigation:**\n" +
          "- Tab: Navigate to retry/dismiss buttons\n" +
          "- Enter/Space: Activate buttons",
      },
    },
    a11y: {
      config: {
        rules: [
          {
            // Ensure color contrast meets WCAG AA for error states
            id: "color-contrast",
            enabled: true,
          },
          {
            // Ensure buttons are keyboard accessible
            id: "button-name",
            enabled: true,
          },
        ],
      },
    },
  },
};

/**
 * Multiple errors in sequence (for testing)
 */
export const MultipleErrors: Story = {
  render: () => (
    <div className="space-y-4">
      <ErrorDisplay
        error={standardError}
        variant="inline"
        onDismiss={() => alert("Error 1 dismissed")}
      />
      <ErrorDisplay
        error={networkError}
        variant="panel"
        showDetails
        retry={() => alert("Retry error 2")}
      />
      <ErrorDisplay
        error={validationError}
        variant="panel"
        showDetails
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Demonstrates multiple error displays stacked vertically.",
      },
    },
  },
};
