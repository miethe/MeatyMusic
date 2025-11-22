/**
 * ImportModal Component
 * Modal dialog for importing JSON entities
 */

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@meatymusic/ui';
import { FileUpload } from './FileUpload';
import { ImportPreview, type ValidationError } from './ImportPreview';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export type EntityType = 'style' | 'lyrics' | 'persona' | 'producerNotes' | 'blueprint' | 'source';

export interface ImportModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Optional pre-selected entity type (if undefined, shows selector) */
  entityType?: EntityType;
  /** Callback when import succeeds */
  onImportSuccess: (entity: unknown) => void;
  /** Optional callback when import fails */
  onImportError?: (error: Error) => void;
}

/**
 * Entity type metadata
 */
const ENTITY_METADATA: Record<EntityType, { label: string; endpoint: string }> = {
  style: { label: 'Style', endpoint: '/styles/import' },
  lyrics: { label: 'Lyrics', endpoint: '/lyrics/import' },
  persona: { label: 'Persona', endpoint: '/personas/import' },
  producerNotes: { label: 'Producer Notes', endpoint: '/producer-notes/import' },
  blueprint: { label: 'Blueprint', endpoint: '/blueprints/import' },
  source: { label: 'Source', endpoint: '/sources/import' },
};

/**
 * ImportModal - Complete import flow in a modal
 *
 * Features:
 * - Entity type selection (if not pre-specified)
 * - File upload with drag-drop
 * - JSON validation and preview
 * - Import progress and error handling
 * - Success/error callbacks
 *
 * @example
 * ```tsx
 * <ImportModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   entityType="style"
 *   onImportSuccess={(entity) => console.log('Imported:', entity)}
 * />
 * ```
 */
export const ImportModal: React.FC<ImportModalProps> = ({
  open,
  onOpenChange,
  entityType: initialEntityType,
  onImportSuccess,
  onImportError,
}) => {
  const [selectedEntityType, setSelectedEntityType] = React.useState<EntityType | undefined>(initialEntityType);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [jsonData, setJsonData] = React.useState<unknown>(null);
  const [parseError, setParseError] = React.useState<string | undefined>();
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);
  const [isValid, setIsValid] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importError, setImportError] = React.useState<string | undefined>();

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setJsonData(null);
      setParseError(undefined);
      setValidationErrors([]);
      setIsValid(false);
      setIsImporting(false);
      setImportError(undefined);
      if (!initialEntityType) {
        setSelectedEntityType(undefined);
      }
    }
  }, [open, initialEntityType]);

  // Parse JSON when file is selected
  React.useEffect(() => {
    if (!selectedFile) {
      setJsonData(null);
      setParseError(undefined);
      setValidationErrors([]);
      setIsValid(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        setJsonData(parsed);
        setParseError(undefined);

        // Basic validation - check if it's an object
        if (typeof parsed !== 'object' || parsed === null) {
          setValidationErrors([
            { field: 'root', message: 'JSON must be an object' },
          ]);
          setIsValid(false);
        } else {
          // Clear validation errors - backend will validate on import
          setValidationErrors([]);
          setIsValid(true);
        }
      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'Failed to parse JSON');
        setJsonData(null);
        setIsValid(false);
      }
    };

    reader.onerror = () => {
      setParseError('Failed to read file');
      setJsonData(null);
      setIsValid(false);
    };

    reader.readAsText(selectedFile);
  }, [selectedFile]);

  const handleImport = async () => {
    if (!selectedFile || !selectedEntityType) return;

    setIsImporting(true);
    setImportError(undefined);

    try {
      const endpoint = ENTITY_METADATA[selectedEntityType].endpoint;

      // Create FormData and append the file with the expected field name "file"
      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data } = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(`${ENTITY_METADATA[selectedEntityType].label} imported successfully`);
      onImportSuccess(data);
      onOpenChange(false);
    } catch (error) {
      let errorMessage = 'Failed to import';

      // Check if error has validation details
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { detail?: unknown } } }).response;
        if (response?.data?.detail) {
          const detail = response.data.detail;

          // Handle validation errors from backend
          if (Array.isArray(detail)) {
            const errors: ValidationError[] = detail.map((err: { loc?: string[]; msg?: string }) => ({
              field: err.loc?.join('.') || 'unknown',
              message: err.msg || 'Validation error',
            }));
            setValidationErrors(errors);
            setIsValid(false);
            errorMessage = 'Validation failed - please check the errors below';
            setImportError(errorMessage);
            toast.error(errorMessage);
            setIsImporting(false);
            return;
          } else if (typeof detail === 'string') {
            errorMessage = detail;
          }
        }
      }

      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      setImportError(errorMessage);
      toast.error(errorMessage);
      onImportError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsImporting(false);
    }
  };

  const canImport = selectedEntityType && isValid && selectedFile && !isImporting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Entity</DialogTitle>
          <DialogDescription>
            Upload a JSON file to import an entity into MeatyMusic
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Entity Type Selector (only if not pre-specified) */}
          {!initialEntityType && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-strong">
                Entity Type <span className="text-error-strong">*</span>
              </label>
              <Select
                value={selectedEntityType}
                onValueChange={(value) => setSelectedEntityType(value as EntityType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENTITY_METADATA).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!!selectedEntityType && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-strong">
                Upload JSON File <span className="text-error-strong">*</span>
              </label>
              <FileUpload
                onFileSelect={setSelectedFile}
                error={parseError}
              />
            </div>
          )}

          {!!jsonData && (
            <ImportPreview
              jsonData={jsonData}
              validationErrors={validationErrors}
              isValid={isValid}
            />
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex-1">
              {importError && (
                <p className="text-sm text-error-strong" role="alert">
                  {importError}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleImport}
                disabled={!canImport}
                loading={isImporting}
                loadingText="Importing..."
              >
                Import
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ImportModal.displayName = 'ImportModal';

export default ImportModal;
