/**
 * ImportPreview Component
 * Displays JSON preview with validation status and errors
 */

'use client';

import * as React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JsonViewer } from '@/components/common/JsonViewer';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ImportPreviewProps {
  /** JSON data to preview */
  jsonData: unknown;
  /** List of validation errors */
  validationErrors?: ValidationError[];
  /** Whether the JSON is valid */
  isValid: boolean;
  /** Additional className */
  className?: string;
}

/**
 * ImportPreview - Shows JSON data with validation status
 *
 * Features:
 * - Syntax-highlighted JSON display
 * - Validation status indicator
 * - Error list with field names
 * - Success state
 *
 * @example
 * ```tsx
 * <ImportPreview
 *   jsonData={parsedData}
 *   validationErrors={[{ field: 'name', message: 'Required field' }]}
 *   isValid={false}
 * />
 * ```
 */
export const ImportPreview: React.FC<ImportPreviewProps> = ({
  jsonData,
  validationErrors = [],
  isValid,
  className,
}) => {
  const hasErrors = validationErrors.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Validation Status Header */}
      <div
        className={cn(
          'flex items-center gap-3 p-4 rounded-lg border',
          isValid && !hasErrors
            ? 'bg-success-subtle/10 border-success-strong'
            : 'bg-error-subtle/10 border-error-strong'
        )}
      >
        {isValid && !hasErrors ? (
          <>
            <CheckCircle className="h-5 w-5 text-success-strong flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium text-success-strong">Valid JSON</p>
              <p className="text-sm text-text-muted">Ready to import</p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-error-strong flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium text-error-strong">Validation Failed</p>
              <p className="text-sm text-text-muted">
                {hasErrors ? `${validationErrors.length} error${validationErrors.length > 1 ? 's' : ''} found` : 'Invalid JSON format'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Validation Errors List */}
      {hasErrors && (
        <div className="space-y-2" role="alert" aria-live="polite">
          <h3 className="text-sm font-medium text-text-strong">Validation Errors:</h3>
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div
                key={`${error.field}-${index}`}
                className="flex items-start gap-2 p-3 rounded-md bg-surface-subtle border border-border-subtle"
              >
                <AlertCircle className="h-4 w-4 text-warning-strong mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-text-strong">
                    Field: <code className="px-1 py-0.5 rounded bg-bg-elevated font-mono text-xs">{error.field}</code>
                  </p>
                  <p className="text-text-muted mt-1">{error.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JSON Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-strong">JSON Preview:</h3>
        <div className="overflow-x-hidden">
          <JsonViewer
            data={typeof jsonData === 'object' && jsonData !== null ? jsonData : {}}
            theme="dark"
            showLineNumbers={true}
            enableClipboard={true}
            collapsed={2}
            maxHeight="400px"
          />
        </div>
      </div>
    </div>
  );
};

ImportPreview.displayName = 'ImportPreview';

export default ImportPreview;
