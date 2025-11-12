import React from 'react';

export interface AuthFormProps {
  /** The main title of the auth form */
  title: string;
  /** Subtitle or description text */
  subtitle?: string;
  /** The main form content */
  children: React.ReactNode;
  /** Footer content like navigation links */
  footer?: React.ReactNode;
  /** Whether to show the gradient background */
  showGradient?: boolean;
  /** Custom className for the container */
  className?: string;
}

/**
 * A consistent wrapper for authentication forms across the application.
 * Provides a standardized layout with title, subtitle, form content, and footer.
 */
export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  subtitle,
  children,
  footer,
  showGradient = true,
  className = '',
}) => {
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        showGradient
          ? 'bg-gradient-to-br from-primary/5 via-background to-accent/5'
          : 'bg-background'
      } ${className}`}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* Form Content */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="text-center mt-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
