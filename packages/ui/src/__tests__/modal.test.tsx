import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import { Modal } from '../modal';

describe('Modal', () => {
  it('renders when open', () => {
    const { getByText } = render(
      <Modal open onOpenChange={() => {}}>
        <div>Content</div>
      </Modal>
    );
    expect(getByText('Content')).toBeInTheDocument();
  });

  it('calls onOpenChange on escape', () => {
    const onOpenChange = jest.fn();
    render(
      <Modal open onOpenChange={onOpenChange}>
        <button>close</button>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
