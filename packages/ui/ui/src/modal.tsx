'use client';

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  label?: string;
}
export const Modal: React.FC<ModalProps> = ({ open, onOpenChange, children, label }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const focusable = containerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex="0"], [role="button"], [role="checkbox"], [role="radio"]'
    );
    focusable?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      {...(label ? { 'aria-labelledby': 'modal-label' } : {})}
    >
      <div ref={containerRef} tabIndex={-1} className="bg-white p-4 rounded-md shadow-lg max-h-[90vh] overflow-auto">
        {label && (
          <h2 id="modal-label" className="text-lg font-semibold mb-2">
            {label}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
