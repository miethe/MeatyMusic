import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileUpload } from './FileUpload';
import * as React from 'react';
import { useState } from 'react';

const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'FileUpload component with drag-and-drop support, file validation, and preview functionality. Fully accessible with keyboard navigation and screen reader support.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for interactive stories
function FileUploadDemo(props: Partial<React.ComponentProps<typeof FileUpload>>) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="max-w-2xl">
      <FileUpload
        onFilesSelected={setFiles}
        value={files}
        {...props}
      />
      {files.length > 0 && (
        <div className="mt-4 p-4 bg-surface-subtle rounded-lg">
          <p className="text-sm font-medium text-text-strong mb-2">
            Console Output:
          </p>
          <pre className="text-xs text-text-muted">
            {JSON.stringify(
              files.map(f => ({ name: f.name, size: f.size, type: f.type })),
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

// 1. Default (single file)
export const Default: Story = {
  render: () => <FileUploadDemo />,
};

// 2. Multiple files
export const MultipleFiles: Story = {
  render: () => <FileUploadDemo multiple maxFiles={5} />,
  parameters: {
    docs: {
      description: {
        story: 'Allow multiple file selection with a maximum limit.',
      },
    },
  },
};

// 3. Images only
export const ImagesOnly: Story = {
  render: () => (
    <FileUploadDemo
      accept="image/*"
      multiple
      maxFiles={10}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Restrict file selection to images only. Image previews are automatically shown.',
      },
    },
  },
};

// 4. Documents only
export const DocumentsOnly: Story = {
  render: () => (
    <FileUploadDemo
      accept=".pdf,.doc,.docx,.txt"
      multiple
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Restrict file selection to document types (PDF, Word, text files).',
      },
    },
  },
};

// 5. With size restriction
export const WithSizeRestriction: Story = {
  render: () => (
    <FileUploadDemo
      maxSize={5 * 1024 * 1024} // 5MB
      multiple
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Limit file size to 5MB. Larger files will show an error.',
      },
    },
  },
};

// 6. With image preview
export const WithImagePreview: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    // Create a mock image file for preview demonstration
    React.useEffect(() => {
      // This would normally come from user selection
      // For demo purposes, we just show the UI structure
    }, []);

    return (
      <div className="max-w-2xl">
        <FileUploadDemo
          accept="image/*"
          multiple
        />
        <p className="mt-4 text-sm text-text-muted">
          Select image files to see automatic thumbnail previews
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Image files automatically show thumbnail previews.',
      },
    },
  },
};

// 7. Error state - Invalid file type
export const ErrorInvalidType: Story = {
  render: () => (
    <div className="max-w-2xl">
      <FileUploadDemo accept="image/*" />
      <div className="mt-4 p-4 bg-error-subtle/10 border border-error-strong rounded-lg">
        <p className="text-sm text-error-strong">
          Try uploading a non-image file to see the error state
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error message is shown when file type does not match the accepted types.',
      },
    },
  },
};

// 8. Error state - File too large
export const ErrorTooLarge: Story = {
  render: () => (
    <div className="max-w-2xl">
      <FileUploadDemo maxSize={1024 * 1024} /> {/* 1MB */}
      <div className="mt-4 p-4 bg-error-subtle/10 border border-error-strong rounded-lg">
        <p className="text-sm text-error-strong">
          Try uploading a file larger than 1MB to see the error state
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error message is shown when file size exceeds the maximum limit.',
      },
    },
  },
};

// 9. Disabled state
export const Disabled: Story = {
  render: () => <FileUploadDemo disabled />,
  parameters: {
    docs: {
      description: {
        story: 'Disabled state prevents all interactions.',
      },
    },
  },
};

// 10. With existing files
export const WithExistingFiles: Story = {
  render: () => {
    // Create mock File objects for demonstration
    const mockFile1 = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    const mockFile2 = new File(['content'], 'image.jpg', { type: 'image/jpeg' });

    const [files, setFiles] = useState<File[]>([mockFile1, mockFile2]);

    return (
      <FileUpload
        onFilesSelected={setFiles}
        value={files}
        multiple
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Display existing files that can be removed.',
      },
    },
  },
};

// 11. Real-world: Avatar upload
export const AvatarUpload: Story = {
  render: () => (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold text-text-strong mb-4">
        Profile Picture
      </h3>
      <FileUploadDemo
        accept="image/png,image/jpeg,image/webp"
        maxSize={2 * 1024 * 1024} // 2MB
        multiple={false}
        label="Upload your profile picture"
        description="PNG, JPG or WebP • Max 2MB"
        size="compact"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Single image upload for user avatar/profile picture.',
      },
    },
  },
};

// 12. Real-world: Document import
export const DocumentImport: Story = {
  render: () => (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold text-text-strong mb-2">
        Import Documents
      </h3>
      <p className="text-sm text-text-muted mb-4">
        Upload multiple documents to import into your workspace
      </p>
      <FileUploadDemo
        accept=".pdf,.doc,.docx,.txt,.md"
        maxSize={10 * 1024 * 1024} // 10MB
        multiple
        maxFiles={20}
        label="Drop documents here or click to browse"
        description="PDF, Word, Text, Markdown • Max 10MB per file • Up to 20 files"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple document upload for import workflows.',
      },
    },
  },
};

// 13. Compact size
export const CompactSize: Story = {
  render: () => <FileUploadDemo size="compact" />,
  parameters: {
    docs: {
      description: {
        story: 'Compact variant with reduced padding.',
      },
    },
  },
};

// 14. Custom labels
export const CustomLabels: Story = {
  render: () => (
    <FileUploadDemo
      label="Choose files to upload"
      description="Any file type • No size limit"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom label and description text.',
      },
    },
  },
};

// Accessibility Tests
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <div className="p-4 bg-surface-subtle rounded-lg">
        <h4 className="text-sm font-semibold text-text-strong mb-2">
          Keyboard Navigation Test
        </h4>
        <ul className="text-sm text-text-muted space-y-1">
          <li>• Tab to focus the upload area</li>
          <li>• Press Enter or Space to open file dialog</li>
          <li>• Tab through file list items</li>
          <li>• Press Enter or Space on remove button to delete files</li>
          <li>• Upload area has visible focus ring</li>
        </ul>
      </div>
      <FileUploadDemo multiple />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full keyboard accessibility with Enter/Space to trigger file selection and remove files.',
      },
    },
  },
};

export const ScreenReaderTest: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <div className="p-4 bg-surface-subtle rounded-lg">
        <h4 className="text-sm font-semibold text-text-strong mb-2">
          Screen Reader Accessibility
        </h4>
        <ul className="text-sm text-text-muted space-y-1">
          <li>• Upload area has role="button" and aria-label</li>
          <li>• File input has sr-only class for screen readers</li>
          <li>• Error messages use role="alert" and aria-live="polite"</li>
          <li>• File list has role="list" and aria-label</li>
          <li>• Remove buttons have descriptive aria-label with file name</li>
          <li>• Disabled state announced via aria-disabled</li>
        </ul>
      </div>
      <FileUploadDemo multiple />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive screen reader support with ARIA labels and live regions.',
      },
    },
  },
};

export const DragAndDropVisualFeedback: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <div className="p-4 bg-surface-subtle rounded-lg">
        <h4 className="text-sm font-semibold text-text-strong mb-2">
          Drag & Drop Visual Feedback
        </h4>
        <ul className="text-sm text-text-muted space-y-1">
          <li>• Hover to see border color change</li>
          <li>• Drag a file over the area to see drag-over state</li>
          <li>• Border becomes solid and background changes</li>
          <li>• Upload icon color changes to accent</li>
          <li>• Label text updates to "Drop files here"</li>
        </ul>
      </div>
      <FileUploadDemo multiple />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual feedback for hover and drag-over states.',
      },
    },
  },
};

// Edge Cases
export const MaxFilesReached: Story = {
  render: () => {
    const mockFiles = Array.from({ length: 3 }, (_, i) =>
      new File(['content'], `file-${i + 1}.txt`, { type: 'text/plain' })
    );

    const [files, setFiles] = useState<File[]>(mockFiles);

    return (
      <div className="max-w-2xl">
        <div className="mb-4 p-4 bg-surface-subtle rounded-lg">
          <p className="text-sm text-text-muted">
            Maximum of 3 files allowed. Try adding more to see the error.
          </p>
        </div>
        <FileUpload
          onFilesSelected={setFiles}
          value={files}
          multiple
          maxFiles={3}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Error shown when maximum number of files is reached.',
      },
    },
  },
};

export const MixedValidAndInvalidFiles: Story = {
  render: () => (
    <div className="max-w-2xl">
      <div className="mb-4 p-4 bg-surface-subtle rounded-lg">
        <p className="text-sm text-text-muted">
          Only accepts images under 5MB. Try selecting a mix of valid and invalid files.
        </p>
      </div>
      <FileUploadDemo
        accept="image/*"
        maxSize={5 * 1024 * 1024}
        multiple
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Valid files are added while invalid files show errors.',
      },
    },
  },
};
