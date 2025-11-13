import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SparklineComplication } from '../SparklineComplication';
import type { ComplicationProps } from '../../types';

const baseContext: ComplicationProps = {
  cardId: 'spark-card',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Spark Card',
  isFocused: false,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false,
  },
  slot: 'topLeft',
  isVisible: true,
};

describe('SparklineComplication', () => {
  it('renders sparkline path', () => {
    render(
      <SparklineComplication
        {...baseContext}
        data={[1, 3, 2, 5]}
        label="Trend"
      />
    );

    const container = screen.getByRole('img', { name: /trend/i });
    const path = container.querySelector('path');
    expect(path).toBeTruthy();
  });
});
