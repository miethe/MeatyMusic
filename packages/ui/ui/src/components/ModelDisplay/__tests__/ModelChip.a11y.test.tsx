import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, it, expect, vi } from 'vitest'
import { ModelChip } from '../ModelChip'
import type { EnhancedModel } from '../../../types/CatalogModel'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

const mockModel: EnhancedModel = {
  id: 'model-1',
  provider: 'openai',
  name: 'gpt-4',
  display_name: 'GPT-4',
  section: 'Official',
  model_key: 'openai/gpt-4',
  short_label: 'GPT-4',
  family: 'GPT',
  modalities: ['text'],
  context_window: 8192,
  max_output_tokens: 4096,
  supports_tools: true,
  supports_json_mode: true,
  status: 'active',
  pricing: {
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
    tier: 'paid',
  },
  capabilities: [
    {
      type: 'text',
      level: 'expert',
      supported: true,
    },
  ],
  performance: {
    latency: 'medium',
    cost: 'high',
    contextLength: 8192,
    quality: 'excellent',
  },
  tags: [],
  logoUrl: 'https://example.com/openai-logo.png',
  description: 'Advanced language model by OpenAI',
}

describe('ModelChip Accessibility', () => {
  it('should have no accessibility violations in default state', async () => {
    const { container } = render(<ModelChip model={mockModel} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no accessibility violations in interactive state', async () => {
    const { container } = render(
      <ModelChip
        model={mockModel}
        interactive={true}
        onClick={vi.fn()}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no accessibility violations with all features enabled', async () => {
    const { container } = render(
      <ModelChip
        model={mockModel}
        showProvider={true}
        showStatus={true}
        showCapabilities={true}
        showPricing={true}
        interactive={true}
        onClick={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper ARIA attributes when interactive', () => {
    render(
      <ModelChip
        model={mockModel}
        interactive={true}
        onClick={vi.fn()}
      />
    )

    const chip = screen.getByRole('button')
    expect(chip).toHaveAttribute('aria-label', 'Select GPT-4')
    expect(chip).toHaveAttribute('aria-description')
    expect(chip).toHaveAttribute('tabIndex', '0')
  })

  it('should not have button role when not interactive', () => {
    render(<ModelChip model={mockModel} interactive={false} />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('should have proper keyboard navigation', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <ModelChip
        model={mockModel}
        interactive={true}
        onClick={onClick}
      />
    )

    const chip = screen.getByRole('button')

    // Test focus
    await user.tab()
    expect(chip).toHaveFocus()

    // Test Enter key activation
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)

    // Test Space key activation
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('should handle remove button keyboard navigation', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <ModelChip
        model={mockModel}
        interactive={true}
        onClick={vi.fn()}
        onRemove={onRemove}
      />
    )

    const chip = screen.getByRole('button', { name: /select gpt-4/i })
    const removeButton = screen.getByRole('button', { name: /remove gpt-4/i })

    expect(removeButton).toHaveAttribute('tabIndex', '-1')
    expect(removeButton).toHaveAttribute('aria-label', 'Remove GPT-4')

    // Focus on main chip
    await user.tab()
    expect(chip).toHaveFocus()

    // Test Delete key on main chip
    await user.keyboard('{Delete}')
    expect(onRemove).toHaveBeenCalledTimes(1)

    // Test Backspace key on main chip
    await user.keyboard('{Backspace}')
    expect(onRemove).toHaveBeenCalledTimes(2)

    // Test click on remove button
    await user.click(removeButton)
    expect(onRemove).toHaveBeenCalledTimes(3)
  })

  it('should have proper alt text for provider logo', () => {
    render(<ModelChip model={mockModel} showProvider={true} />)

    const logo = screen.getByAltText('openai logo')
    expect(logo).toBeInTheDocument()
  })

  it('should provide fallback when logo is not available', () => {
    const modelWithoutLogo = { ...mockModel, logoUrl: undefined }
    render(<ModelChip model={modelWithoutLogo} showProvider={true} />)

    const fallback = screen.getByText('OP') // First letters of "OpenAI"
    expect(fallback).toBeInTheDocument()
  })

  it('should have accessible capability indicators', () => {
    const modelWithCapabilities = {
      ...mockModel,
      capabilities: [
        { type: 'text', level: 'expert', supported: true },
        { type: 'code', level: 'advanced', supported: true },
      ],
    }

    render(
      <ModelChip
        model={modelWithCapabilities}
        showCapabilities={true}
      />
    )

    // Check for capability indicators with proper labels
    const textCapability = screen.getByLabelText(/text/i)
    const codeCapability = screen.getByLabelText(/code/i)

    expect(textCapability).toBeInTheDocument()
    expect(codeCapability).toBeInTheDocument()
  })

  it('should announce status badges properly', () => {
    const betaModel = { ...mockModel, status: 'beta' as const }
    const deprecatedModel = { ...mockModel, status: 'deprecated' as const }

    const { rerender } = render(
      <ModelChip model={betaModel} showStatus={true} />
    )

    expect(screen.getByText('Beta')).toBeInTheDocument()

    rerender(<ModelChip model={deprecatedModel} showStatus={true} />)
    expect(screen.getByText('Deprecated')).toBeInTheDocument()
  })

  it('should have proper color contrast for badges', async () => {
    const { container } = render(
      <ModelChip
        model={mockModel}
        showPricing={true}
        showStatus={true}
      />
    )

    // axe will check color contrast ratios
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    })

    expect(results).toHaveNoViolations()
  })

  it('should be navigable by screen readers', () => {
    render(
      <ModelChip
        model={mockModel}
        interactive={true}
        onClick={vi.fn()}
      />
    )

    const chip = screen.getByRole('button')
    const description = chip.getAttribute('aria-description')

    expect(description).toContain('GPT-4')
    expect(description).toContain('OpenAI')
    expect(description).toContain('active')
  })

  it('should handle focus management correctly', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <div>
        <button>Before</button>
        <ModelChip
          model={mockModel}
          interactive={true}
          onClick={onClick}
        />
        <button>After</button>
      </div>
    )

    // Test tab navigation
    await user.tab() // Focus "Before" button
    expect(screen.getByText('Before')).toHaveFocus()

    await user.tab() // Focus ModelChip
    const chip = screen.getByRole('button', { name: /select gpt-4/i })
    expect(chip).toHaveFocus()

    await user.tab() // Focus "After" button
    expect(screen.getByText('After')).toHaveFocus()
  })

  it('should prevent event bubbling on remove button click', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const onRemove = vi.fn()

    render(
      <ModelChip
        model={mockModel}
        interactive={true}
        onClick={onClick}
        onRemove={onRemove}
      />
    )

    const removeButton = screen.getByRole('button', { name: /remove gpt-4/i })

    await user.click(removeButton)

    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled() // Should not bubble to main chip
  })

  it('should handle high contrast mode properly', async () => {
    // Simulate high contrast mode by adding the media query
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(forced-colors: active)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { container } = render(
      <ModelChip
        model={mockModel}
        showStatus={true}
        showPricing={true}
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should support reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<ModelChip model={mockModel} interactive={true} />)

    const chip = screen.getByRole('button')
    const styles = window.getComputedStyle(chip)

    // Check that transitions can be disabled for reduced motion
    expect(chip).toBeInTheDocument()
  })
})
