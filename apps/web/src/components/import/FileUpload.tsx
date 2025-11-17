/**
 * FileUpload Component for Import Flow
 * Specialized wrapper around the UI FileUpload component
 * for JSON entity import with validation
 */

'use client';

import * as React from 'react';
import { FileUpload as UIFileUpload } from '@meatymusic/ui';

export interface FileUploadProps {
  /** Callback when a file is selected */
  onFileSelect: (file: File | null) => void;
  /** Error message to display */
  error?: string;
  /** Accepted file types (default: .json) */
  accept?: string;
  /** Maximum file size in MB (default: 10) */
  maxSizeMB?: number;
}

/**
 * FileUpload for JSON entity imports
 *
 * Features:
 * - Drag-and-drop support
 * - JSON file validation
 * - File size limits
 * - Error states
 *
 * @example
 * ```tsx
 * <FileUpload
 *   onFileSelect={(file) => console.log(file)}
 *   error="Invalid JSON format"
 * />
 * ```
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  error,
  accept = '.json,application/json',
  maxSizeMB = 10,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const handleFilesSelected = React.useCallback(
    (files: File[]) => {
      const file = files[0] || null;
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleFileRemove = React.useCallback(() => {
    setSelectedFile(null);
    onFileSelect(null);
  }, [onFileSelect]);

  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  return (
    <div className="space-y-2">
      <UIFileUpload
        accept={accept}
        maxSize={maxSize}
        multiple={false}
        onFilesSelected={handleFilesSelected}
        onFileRemove={handleFileRemove}
        value={selectedFile ? [selectedFile] : []}
        label="Drop JSON file here or click to browse"
        description={`Accepted: JSON files • Max size: ${maxSizeMB}MB`}
        size="default"
      />

      {error && (
        <div
          className="flex items-start gap-2 p-3 rounded-md bg-error-subtle/10 border border-error-strong"
          role="alert"
        >
          <div className="flex-1 text-sm">
            <p className="font-medium text-error-strong">Upload Error</p>
            <p className="text-text-muted">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

FileUpload.displayName = 'FileUpload';

export default FileUpload;
