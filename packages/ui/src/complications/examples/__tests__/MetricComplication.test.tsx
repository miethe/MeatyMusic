import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricComplication } from '../MetricComplication';
import type { ComplicationProps } from '../../types';

const baseContext: ComplicationProps = {
  cardId: 'test-card',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Test Card',
  isFocused: false,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false,
  },
  slot: 'bottomRight',
  isVisible: true,
};

describe('MetricComplication', () => {
  it('renders formatted value with label', () => {
    render(
      <MetricComplication
        {...baseContext}
        value={42}
        unit="%"
        label="Success"
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });
});
