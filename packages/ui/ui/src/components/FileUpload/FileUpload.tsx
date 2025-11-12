import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Upload, X, File, Image as ImageIcon, FileText, AlertCircle } from "lucide-react";
import { Button } from "../Button/Button";

const fileUploadVariants = cva(
  "relative rounded-lg border-2 border-dashed transition-colors",
  {
    variants: {
      variant: {
        default: "border-border-subtle hover:border-border-strong bg-surface-subtle",
        dragOver: "border-accent-strong bg-accent-subtle/10",
        error: "border-error-strong bg-error-subtle/10",
      },
      size: {
        default: "p-8",
        compact: "p-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const fileListItemVariants = cva(
  "flex items-center gap-3 p-3 rounded-md border border-border-subtle bg-surface-base",
  {
    variants: {
      status: {
        valid: "border-border-subtle",
        invalid: "border-error-strong bg-error-subtle/10",
      },
    },
    defaultVariants: {
      status: "valid",
    },
  }
);

export interface FileUploadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrop">,
    VariantProps<typeof fileUploadVariants> {
  /** Accepted file types (MIME types or extensions), e.g., "image/*,.pdf" */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Callback when files are selected */
  onFilesSelected: (files: File[]) => void;
  /** Callback when a file is removed */
  onFileRemove?: (file: File) => void;
  /** Current file value(s) */
  value?: File[];
  /** Custom label text */
  label?: string;
  /** Custom description text */
  description?: string;
}

interface FileError {
  file: File;
  error: string;
}

/**
 * FileUpload component for drag-and-drop and click-to-browse file selection.
 *
 * Features:
 * - Drag-and-drop support with visual feedback
 * - File type validation (accept prop)
 * - File size validation (maxSize prop)
 * - Multiple file support
 * - Image preview thumbnails
 * - Error states for invalid files
 * - Fully keyboard accessible
 *
 * @example
 * ```tsx
 * <FileUpload
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024} // 5MB
 *   multiple
 *   onFilesSelected={(files) => console.log(files)}
 *   value={selectedFiles}
 * />
 * ```
 */
const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      className,
      variant,
      size,
      accept,
      maxSize,
      maxFiles = 10,
      multiple = false,
      disabled = false,
      onFilesSelected,
      onFileRemove,
      value = [],
      label,
      description,
      ...props
    },
    ref
  ) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [errors, setErrors] = React.useState<FileError[]>([]);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
      // Check file size
      if (maxSize && file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        return `File size exceeds ${maxSizeMB}MB limit`;
      }

      // Check file type
      if (accept) {
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type;
          }
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(`${category}/`);
          }
          return file.type === type;
        });

        if (!isAccepted) {
          return `File type not accepted. Accepted: ${accept}`;
        }
      }

      // Check max files
      if (value.length >= maxFiles) {
        return `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`;
      }

      return null;
    };

    const handleFiles = (files: FileList | null) => {
      if (!files || disabled) return;

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const fileErrors: FileError[] = [];

      fileArray.forEach(file => {
        const error = validateFile(file);
        if (error) {
          fileErrors.push({ file, error });
        } else {
          validFiles.push(file);
        }
      });

      setErrors(fileErrors);

      if (validFiles.length > 0) {
        if (multiple) {
          onFilesSelected([...value, ...validFiles].slice(0, maxFiles));
        } else {
          onFilesSelected([validFiles[0]]);
        }
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      handleFiles(e.dataTransfer.files);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    };

    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault();
        handleClick();
      }
    };

    const handleRemove = (file: File) => {
      const newFiles = value.filter(f => f !== file);
      onFilesSelected(newFiles);
      onFileRemove?.(file);
      setErrors(errors.filter(e => e.file !== file));
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) return ImageIcon;
      if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
      return File;
    };

    const [imagePreviews, setImagePreviews] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
      // Generate image previews
      value.forEach(file => {
        if (file.type.startsWith('image/') && !imagePreviews[file.name]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreviews(prev => ({
              ...prev,
              [file.name]: e.target?.result as string
            }));
          };
          reader.readAsDataURL(file);
        }
      });
    }, [value]);

    const currentVariant = disabled ? "default" : isDragOver ? "dragOver" : errors.length > 0 ? "error" : variant || "default";

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {/* Drop Zone */}
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label || "Upload files"}
          aria-disabled={disabled}
          className={cn(
            fileUploadVariants({ variant: currentVariant, size }),
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-strong focus:ring-offset-2"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            disabled={disabled}
            className="sr-only"
            aria-hidden="true"
          />

          <div className="flex flex-col items-center justify-center text-center">
            <Upload
              className={cn(
                "h-12 w-12 mb-4",
                isDragOver ? "text-accent-strong" : "text-text-muted"
              )}
              aria-hidden="true"
            />

            <p className="text-sm font-medium text-text-strong mb-1">
              {label || (isDragOver ? "Drop files here" : "Click to browse or drag and drop")}
            </p>

            <p className="text-xs text-text-muted">
              {description || (
                <>
                  {accept && `Accepted: ${accept}`}
                  {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
                  {multiple && ` • Up to ${maxFiles} files`}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div role="alert" aria-live="polite" className="space-y-2">
            {errors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 rounded-md bg-error-subtle/10 border border-error-strong"
              >
                <AlertCircle className="h-4 w-4 text-error-strong mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-error-strong">{error.file.name}</p>
                  <p className="text-text-muted">{error.error}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File List */}
        {value.length > 0 && (
          <div className="space-y-2" role="list" aria-label="Selected files">
            {value.map((file, index) => {
              const FileIcon = getFileIcon(file);
              const preview = imagePreviews[file.name];

              return (
                <div
                  key={`${file.name}-${index}`}
                  role="listitem"
                  className={cn(fileListItemVariants({ status: "valid" }))}
                >
                  {/* File Icon/Preview */}
                  {preview ? (
                    <img
                      src={preview}
                      alt={file.name}
                      className="h-16 w-16 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded bg-surface-subtle flex items-center justify-center flex-shrink-0">
                      <FileIcon className="h-8 w-8 text-text-muted" aria-hidden="true" />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-strong truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(file)}
                    disabled={disabled}
                    aria-label={`Remove ${file.name}`}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
