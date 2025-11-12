/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MetricCard } from '../MetricCard'
import { TrendingUp, Users } from 'lucide-react'

describe('MetricCard', () => {
  it('renders basic metric card', () => {
    render(
      <MetricCard
        title="Total Users"
        value={1250}
      />
    )

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('1.3K')).toBeInTheDocument() // Formatted value
  })

  it('renders with description', () => {
    render(
      <MetricCard
        title="Active Users"
        value={42}
        description="Currently online"
      />
    )

    expect(screen.getByText('Active Users')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Currently online')).toBeInTheDocument()
  })

  it('renders with prefix and suffix', () => {
    render(
      <MetricCard
        title="Conversion Rate"
        value="15.5"
        prefix="+"
        suffix="%"
      />
    )

    expect(screen.getByText('+15.5%')).toBeInTheDocument()
  })

  it('renders with trend indicator', () => {
    render(
      <MetricCard
        title="Revenue"
        value={5000}
        trend={{
          value: 12.5,
          label: 'vs last month',
          isPositive: true
        }}
      />
    )

    expect(screen.getByText('5K')).toBeInTheDocument()
    expect(screen.getByText('12.5% vs last month')).toBeInTheDocument()
  })

  it('renders negative trend', () => {
    render(
      <MetricCard
        title="Bounce Rate"
        value="45.2"
        suffix="%"
        trend={{
          value: 3.2,
          isPositive: false
        }}
      />
    )

    expect(screen.getByText('45.2%')).toBeInTheDocument()
    expect(screen.getByText('3.2%')).toBeInTheDocument()
  })

  it('renders with change badge', () => {
    render(
      <MetricCard
        title="Sales"
        value={850}
        change={{
          value: 125,
          label: 'this week',
          period: 'vs last week'
        }}
      />
    )

    expect(screen.getByText('850')).toBeInTheDocument()
    expect(screen.getByText('+125 this week vs last week')).toBeInTheDocument()
  })

  it('formats large numbers correctly', () => {
    render(
      <MetricCard title="Test" value={1500000} />
    )
    expect(screen.getByText('1.5M')).toBeInTheDocument()
  })

  it('formats thousands correctly', () => {
    render(
      <MetricCard title="Test" value={2500} />
    )
    expect(screen.getByText('2.5K')).toBeInTheDocument()
  })

  it('keeps small numbers unformatted', () => {
    render(
      <MetricCard title="Test" value={42} />
    )
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('applies status styling', () => {
    const { container: positiveContainer } = render(
      <MetricCard title="Test" value={100} status="positive" />
    )
    expect(positiveContainer.querySelector('.border-l-green-500')).toBeInTheDocument()

    const { container: negativeContainer } = render(
      <MetricCard title="Test" value={100} status="negative" />
    )
    expect(negativeContainer.querySelector('.border-l-red-500')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(
      <MetricCard
        title="Loading Card"
        value={100}
        loading={true}
      />
    )

    // Should not show the actual value when loading
    expect(screen.queryByText('100')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading Card')).not.toBeInTheDocument()
  })

  it('renders with icon', () => {
    render(
      <MetricCard
        title="Users"
        value={50}
        icon={<Users data-testid="users-icon" />}
      />
    )

    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
  })

  it('handles string values', () => {
    render(
      <MetricCard
        title="Status"
        value="Active"
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies custom value className', () => {
    render(
      <MetricCard
        title="Test"
        value={100}
        valueClassName="text-red-500"
      />
    )

    const valueElement = screen.getByText('100')
    expect(valueElement).toHaveClass('text-red-500')
  })
})
