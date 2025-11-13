import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Card } from '../card';

describe('Card', () => {
  it('renders sections', () => {
    const { getByText } = render(
      <Card>
        <Card.Header>Header</Card.Header>
        <Card.Content>Body</Card.Content>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    );
    expect(getByText('Header')).toBeInTheDocument();
    expect(getByText('Body')).toBeInTheDocument();
    expect(getByText('Footer')).toBeInTheDocument();
  });
});
