/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Chart } from '../Chart'

describe('Chart', () => {
  const mockChildren = <div data-testid="chart-content">Chart Content</div>

  it('renders chart content when not loading', () => {
    render(
      <Chart title="Test Chart">
        {mockChildren}
      </Chart>
    )

    expect(screen.getByTestId('chart-content')).toBeInTheDocument()
    expect(screen.getByText('Test Chart')).toBeInTheDocument()
  })

  it('renders title and description', () => {
    render(
      <Chart title="Test Chart" description="Chart description">
        {mockChildren}
      </Chart>
    )

    expect(screen.getByText('Test Chart')).toBeInTheDocument()
    expect(screen.getByText('Chart description')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading', () => {
    render(
      <Chart title="Test Chart" loading={true}>
        {mockChildren}
      </Chart>
    )

    // Should show skeleton instead of content
    expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument()
    // Should still show title
    expect(screen.getByText('Test Chart')).toBeInTheDocument()
  })

  it('shows error state with retry button', () => {
    const mockRetry = jest.fn()

    render(
      <Chart title="Test Chart" error="Something went wrong" onRetry={mockRetry}>
        {mockChildren}
      </Chart>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()

    fireEvent.click(retryButton)
    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  it('shows empty state with custom message', () => {
    render(
      <Chart
        title="Test Chart"
        isEmpty={true}
        emptyMessage="No data found"
        emptyAction={<button>Add Data</button>}
      >
        {mockChildren}
      </Chart>
    )

    expect(screen.getByText('No data found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Data' })).toBeInTheDocument()
    expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Chart className="custom-class">
        {mockChildren}
      </Chart>
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('applies custom height', () => {
    render(
      <Chart height={500}>
        {mockChildren}
      </Chart>
    )

    const chartContainer = screen.getByTestId('chart-content').parentElement
    expect(chartContainer).toHaveStyle({ height: '500px', minHeight: '500px' })
  })

  it('applies string height', () => {
    render(
      <Chart height="50vh">
        {mockChildren}
      </Chart>
    )

    const chartContainer = screen.getByTestId('chart-content').parentElement
    expect(chartContainer).toHaveStyle({ height: '50vh', minHeight: '50vh' })
  })

  it('has default height when not specified', () => {
    render(
      <Chart>
        {mockChildren}
      </Chart>
    )

    const chartContainer = screen.getByTestId('chart-content').parentElement
    expect(chartContainer).toHaveStyle({ height: '300px', minHeight: '300px' })
  })
})
