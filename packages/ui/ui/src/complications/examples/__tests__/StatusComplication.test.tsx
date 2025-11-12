import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusComplication } from '../StatusComplication';
import type { ComplicationProps } from '../../types';

const baseContext: ComplicationProps = {
  cardId: 'status-card',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Status Card',
  isFocused: false,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false,
  },
  slot: 'edgeRight',
  isVisible: true,
};

describe('StatusComplication', () => {
  it('shows status text by default', () => {
    render(
      <StatusComplication
        {...baseContext}
        status="online"
      />
    );

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('hides text when dotOnly is true', () => {
    render(
      <StatusComplication
        {...baseContext}
        status="error"
        dotOnly
      />
    );

    expect(screen.queryByText('Error')).not.toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: /error status indicator/i })
    ).toBeInTheDocument();
  });
});
