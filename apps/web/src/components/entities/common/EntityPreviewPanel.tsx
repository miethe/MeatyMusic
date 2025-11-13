'use client';

import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface EntityPreviewPanelProps {
  entity: Record<string, unknown>;
  validationErrors?: ValidationError[];
  metadata?: {
    created_at?: string;
    updated_at?: string;
    version?: string;
  };
  className?: string;
}

export function EntityPreviewPanel({
  entity,
  validationErrors = [],
  metadata,
  className = '',
}: EntityPreviewPanelProps) {
  const errors = validationErrors.filter((e) => e.severity === 'error');
  const warnings = validationErrors.filter((e) => e.severity === 'warning');
  const hasIssues = validationErrors.length > 0;

  const getStatusIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-accent-error" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-accent-warning" />;
      case 'info':
        return <Info className="h-4 w-4 text-accent-secondary" />;
    }
  };

  const getStatusBgColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'bg-accent-error/10 border-l-accent-error';
      case 'warning':
        return 'bg-accent-warning/10 border-l-accent-warning';
      case 'info':
        return 'bg-accent-secondary/10 border-l-accent-secondary';
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 px-4 py-3 border-b border-border-secondary">
        <h3 className="text-sm font-semibold text-text-primary">Live Preview</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasIssues ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {errors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-accent-error" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-accent-warning" />
              )}
              <span className="text-sm font-medium text-text-primary">
                Validation Status
              </span>
            </div>

            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${getStatusBgColor(
                    error.severity
                  )}`}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(error.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary">
                        {error.field}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {error.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-success/10 border-l-4 border-l-accent-success">
            <CheckCircle className="h-5 w-5 text-accent-success flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-primary">
                Schema Valid
              </p>
              <p className="text-xs text-text-secondary">
                All constraints satisfied
              </p>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-medium text-text-secondary mb-2">
            JSON Output
          </h4>
          <pre className="p-3 rounded-lg bg-background-primary border border-border-secondary overflow-x-auto text-xs font-mono text-text-primary">
            {JSON.stringify(entity, null, 2)}
          </pre>
        </div>

        {metadata && (
          <div>
            <h4 className="text-xs font-medium text-text-secondary mb-2">
              Metadata
            </h4>
            <div className="space-y-1 text-xs">
              {metadata.version && (
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Version:</span>
                  <span className="text-text-primary font-mono">
                    {metadata.version}
                  </span>
                </div>
              )}
              {metadata.created_at && (
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Created:</span>
                  <span className="text-text-primary">
                    {new Date(metadata.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {metadata.updated_at && (
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Updated:</span>
                  <span className="text-text-primary">
                    {new Date(metadata.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-4 py-3 border-t border-border-secondary bg-background-tertiary/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">
            {errors.length > 0
              ? `${errors.length} error${errors.length !== 1 ? 's' : ''}`
              : warnings.length > 0
              ? `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`
              : 'No issues'}
          </span>
          <span className="text-text-tertiary">
            {Object.keys(entity).length} field
            {Object.keys(entity).length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
