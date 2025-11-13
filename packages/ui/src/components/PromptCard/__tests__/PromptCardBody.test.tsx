import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Body } from '../sections';

describe('PromptCard Body', () => {
  it('renders preview text', () => {
    render(
      <Body isCompact={false} isXL={false} bodyPreview="Preview" metrics={{}}>
        <div>child</div>
      </Body>
    );
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
