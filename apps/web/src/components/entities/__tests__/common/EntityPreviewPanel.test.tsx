import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EntityPreviewPanel, ValidationError } from '../../common/EntityPreviewPanel';

describe('EntityPreviewPanel', () => {
  const mockEntity = {
    name: 'Test Entity',
    genre: 'pop',
    bpm: 120,
  };

  const mockErrors: ValidationError[] = [
    { field: 'name', message: 'Name is required', severity: 'error' },
    { field: 'genre', message: 'Genre should be specific', severity: 'warning' },
  ];

  describe('Rendering', () => {
    it('renders with title', () => {
      render(<EntityPreviewPanel entity={mockEntity} />);

      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });

    it('displays entity as JSON', () => {
      render(<EntityPreviewPanel entity={mockEntity} />);

      expect(screen.getByText('JSON Output')).toBeInTheDocument();
      const jsonText = screen.getByText(/"name": "Test Entity"/);
      expect(jsonText).toBeInTheDocument();
    });

    it('displays JSON with all entity fields', () => {
      render(<EntityPreviewPanel entity={mockEntity} />);

      const preElement = screen.getByText(/"name": "Test Entity"/).closest('pre');
      // Check that the pre element contains the entity fields
      expect(preElement).toHaveTextContent('"name"');
      expect(preElement).toHaveTextContent('"Test Entity"');
      expect(preElement).toHaveTextContent('"genre"');
      expect(preElement).toHaveTextContent('"pop"');
      expect(preElement).toHaveTextContent('"bpm"');
      expect(preElement).toHaveTextContent('120');
    });
  });

  describe('Validation Status', () => {
    it('shows success state when no errors', () => {
      render(<EntityPreviewPanel entity={mockEntity} validationErrors={[]} />);

      expect(screen.getByText('Schema Valid')).toBeInTheDocument();
      expect(screen.getByText('All constraints satisfied')).toBeInTheDocument();
    });

    it('shows validation status when errors exist', () => {
      render(<EntityPreviewPanel entity={mockEntity} validationErrors={mockErrors} />);

      expect(screen.getByText('Validation Status')).toBeInTheDocument();
    });

    it('displays error messages', () => {
      render(<EntityPreviewPanel entity={mockEntity} validationErrors={mockErrors} />);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Genre should be specific')).toBeInTheDocument();
    });

    it('displays field names for errors', () => {
      render(<EntityPreviewPanel entity={mockEntity} validationErrors={mockErrors} />);

      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('genre')).toBeInTheDocument();
    });
  });

  describe('Error Severity', () => {
    it('distinguishes between error and warning', () => {
      const errors: ValidationError[] = [
        { field: 'field1', message: 'Error message', severity: 'error' },
        { field: 'field2', message: 'Warning message', severity: 'warning' },
      ];

      render(<EntityPreviewPanel entity={mockEntity} validationErrors={errors} />);

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('shows info severity messages', () => {
      const errors: ValidationError[] = [
        { field: 'field1', message: 'Info message', severity: 'info' },
      ];

      render(<EntityPreviewPanel entity={mockEntity} validationErrors={errors} />);

      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('shows metadata when provided', () => {
      const metadata = {
        version: '1.0',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-16T12:00:00Z',
      };

      render(<EntityPreviewPanel entity={mockEntity} metadata={metadata} />);

      expect(screen.getByText('Metadata')).toBeInTheDocument();
      expect(screen.getByText('Version:')).toBeInTheDocument();
      expect(screen.getByText('1.0')).toBeInTheDocument();
    });

    it('displays creation date', () => {
      const metadata = {
        created_at: '2024-01-15T10:00:00Z',
      };

      render(<EntityPreviewPanel entity={mockEntity} metadata={metadata} />);

      expect(screen.getByText('Created:')).toBeInTheDocument();
    });

    it('displays update date', () => {
      const metadata = {
        updated_at: '2024-01-16T12:00:00Z',
      };

      render(<EntityPreviewPanel entity={mockEntity} metadata={metadata} />);

      expect(screen.getByText('Updated:')).toBeInTheDocument();
    });

    it('hides metadata section when not provided', () => {
      render(<EntityPreviewPanel entity={mockEntity} />);

      expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
    });
  });

  describe('Footer Statistics', () => {
    it('shows error count when errors exist', () => {
      const errors: ValidationError[] = [
        { field: 'field1', message: 'Error 1', severity: 'error' },
        { field: 'field2', message: 'Error 2', severity: 'error' },
      ];

      render(<EntityPreviewPanel entity={mockEntity} validationErrors={errors} />);

      expect(screen.getByText('2 errors')).toBeInTheDocument();
    });

    it('shows singular error text for one error', () => {
      const errors: ValidationError[] = [
        { field: 'field1', message: 'Error 1', severity: 'error' },
      ];

      render(<EntityPreviewPanel entity={mockEntity} validationErrors={errors} />);

      expect(screen.getByText('1 error')).toBeInTheDocument();
    });

    it('shows warning count when only warnings exist', () => {
      const warnings: ValidationError[] = [
        { field: 'field1', message: 'Warning 1', severity: 'warning' },
        { field: 'field2', message: 'Warning 2', severity: 'warning' },
      ];

      render(<EntityPreviewPanel entity={mockEntity} validationErrors={warnings} />);

      expect(screen.getByText('2 warnings')).toBeInTheDocument();
    });

    it('prioritizes errors over warnings in count', () => {
      const mixed: ValidationError[] = [
        { field: 'field1', message: 'Error', severity: 'error' },
        { field: 'field2', message: 'Warning', severity: 'warning' },
      ];

      render(<EntityPreviewPanel entity={mockEntity} validationErrors={mixed} />);

      expect(screen.getByText('1 error')).toBeInTheDocument();
      expect(screen.queryByText('warning')).not.toBeInTheDocument();
    });

    it('shows "No issues" when no errors or warnings', () => {
      render(<EntityPreviewPanel entity={mockEntity} validationErrors={[]} />);

      expect(screen.getByText('No issues')).toBeInTheDocument();
    });

    it('shows field count', () => {
      render(<EntityPreviewPanel entity={mockEntity} />);

      expect(screen.getByText('3 fields')).toBeInTheDocument();
    });

    it('shows singular field text for one field', () => {
      render(<EntityPreviewPanel entity={{ name: 'Test' }} />);

      expect(screen.getByText('1 field')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('handles empty entity object', () => {
      render(<EntityPreviewPanel entity={{}} />);

      expect(screen.getByText('JSON Output')).toBeInTheDocument();
      expect(screen.getByText('0 fields')).toBeInTheDocument();
    });

    it('handles entity with nested objects', () => {
      const complexEntity = {
        name: 'Test',
        nested: {
          field1: 'value1',
          field2: 'value2',
        },
      };

      render(<EntityPreviewPanel entity={complexEntity} />);

      expect(screen.getByText('JSON Output')).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('shows error icon for errors', () => {
      const errors: ValidationError[] = [
        { field: 'field1', message: 'Error', severity: 'error' },
      ];

      const { container } = render(
        <EntityPreviewPanel entity={mockEntity} validationErrors={errors} />
      );

      // Check for alert circle icon (error indicator)
      expect(container.querySelector('.text-accent-error')).toBeInTheDocument();
    });

    it('shows warning icon for warnings', () => {
      const warnings: ValidationError[] = [
        { field: 'field1', message: 'Warning', severity: 'warning' },
      ];

      const { container } = render(
        <EntityPreviewPanel entity={mockEntity} validationErrors={warnings} />
      );

      // Check for warning triangle icon
      expect(container.querySelector('.text-accent-warning')).toBeInTheDocument();
    });

    it('shows success icon when valid', () => {
      const { container } = render(
        <EntityPreviewPanel entity={mockEntity} validationErrors={[]} />
      );

      // Check for success checkmark icon
      expect(container.querySelector('.text-accent-success')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <EntityPreviewPanel entity={mockEntity} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has proper layout structure', () => {
      render(<EntityPreviewPanel entity={mockEntity} />);

      expect(screen.getByText('Live Preview')).toBeInTheDocument();
      expect(screen.getByText('JSON Output')).toBeInTheDocument();
      expect(screen.getByText('No issues')).toBeInTheDocument();
    });
  });

  describe('Complex Entities', () => {
    it('displays arrays in entity', () => {
      const entityWithArray = {
        name: 'Test',
        tags: ['tag1', 'tag2', 'tag3'],
      };

      render(<EntityPreviewPanel entity={entityWithArray} />);

      const preElement = screen.getByText(/"tags":/).closest('pre');
      expect(preElement).toHaveTextContent('"tag1"');
      expect(preElement).toHaveTextContent('"tag2"');
    });

    it('displays nested objects', () => {
      const entityWithNested = {
        name: 'Test',
        config: {
          setting1: 'value1',
          setting2: 'value2',
        },
      };

      render(<EntityPreviewPanel entity={entityWithNested} />);

      const preElement = screen.getByText(/"config":/).closest('pre');
      expect(preElement).toHaveTextContent('"setting1"');
      expect(preElement).toHaveTextContent('"setting2"');
    });

    it('displays null and undefined values', () => {
      const entityWithNull = {
        name: 'Test',
        nullField: null,
        undefinedField: undefined,
      };

      render(<EntityPreviewPanel entity={entityWithNull} />);

      expect(screen.getByText('JSON Output')).toBeInTheDocument();
    });
  });
});
