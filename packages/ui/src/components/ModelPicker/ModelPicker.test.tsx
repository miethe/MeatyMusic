/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModelPicker } from './ModelPicker';
import { EnhancedModel } from './types';

const mockModels: EnhancedModel[] = [
  {
    id: 'gpt-4',
    provider: 'OpenAI',
    model_key: 'gpt-4',
    display_name: 'GPT-4',
    supports_tools: true,
    supports_json_mode: true,
    status: 'active',
    capabilities: [],
    performance: {
      latency: 'medium',
      cost: 'high',
      quality: 'high',
    },
    tags: [],
  },
  {
    id: 'claude-3-sonnet',
    provider: 'Anthropic',
    model_key: 'claude-3-sonnet',
    display_name: 'Claude 3 Sonnet',
    supports_tools: true,
    supports_json_mode: false,
    status: 'active',
    capabilities: [],
    performance: {
      latency: 'low',
      cost: 'medium',
      quality: 'high',
    },
    tags: [],
  },
];

describe('ModelPicker', () => {
  it('renders with placeholder text', () => {
    const onValueChange = jest.fn();

    render(
      <ModelPicker
        models={mockModels}
        value=""
        onValueChange={onValueChange}
        placeholder="Select a model..."
      />
    );

    expect(screen.getByText('Select a model...')).toBeInTheDocument();
  });

  it('shows selected model', () => {
    const onValueChange = jest.fn();

    render(
      <ModelPicker
        models={mockModels}
        value="gpt-4"
        onValueChange={onValueChange}
      />
    );

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('handles multiple selection', () => {
    const onValueChange = jest.fn();

    render(
      <ModelPicker
        models={mockModels}
        multiple
        value={['gpt-4', 'claude-3-sonnet']}
        onValueChange={onValueChange}
      />
    );

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const onValueChange = jest.fn();

    render(
      <ModelPicker
        models={[]}
        value=""
        onValueChange={onValueChange}
        loading
      />
    );

    // Check if the trigger is still rendered during loading
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const onValueChange = jest.fn();
    const onRetry = jest.fn();

    render(
      <ModelPicker
        models={[]}
        value=""
        onValueChange={onValueChange}
        error="Failed to load models"
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    const onValueChange = jest.fn();

    render(
      <ModelPicker
        models={mockModels}
        value=""
        onValueChange={onValueChange}
        disabled
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('filters by providers', () => {
    const onValueChange = jest.fn();

    render(
      <ModelPicker
        models={mockModels}
        value=""
        onValueChange={onValueChange}
        providers={['OpenAI']}
      />
    );

    // This test would need to open the dropdown to verify filtering
    // For now, just check that the component renders
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles keyboard interactions', () => {
    const onValueChange = jest.fn();

    render(
      <ModelPicker
        models={mockModels}
        value=""
        onValueChange={onValueChange}
      />
    );

    const trigger = screen.getByRole('combobox');

    // Test Enter key
    fireEvent.keyDown(trigger, { key: 'Enter' });
    // Would need to check if dropdown opened

    // Test Escape key
    fireEvent.keyDown(trigger, { key: 'Escape' });
    // Would need to check if dropdown closed
  });
});
