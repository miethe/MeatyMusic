import * as React from 'react';
import { BindingsRow, Binding } from './BindingsRow';

/**
 * BindingsRow Example Usage
 *
 * Demonstrates the bindings row with different configurations and overflow behavior.
 */

const sampleBindings: Binding[] = [
  { type: 'context', name: 'API Documentation', id: '1' },
  { type: 'context', name: 'Style Guide', id: '2' },
  { type: 'agent', name: 'Code Reviewer', id: '3' },
  { type: 'agent', name: 'Test Generator', id: '4' },
  { type: 'variable', name: 'userName', id: '5' },
  { type: 'variable', name: 'apiKey', id: '6' },
  { type: 'model', name: 'GPT-4 Turbo', id: '7' },
  { type: 'model', name: 'Claude 3 Opus', id: '8' },
];

export function BindingsRowExample() {
  const [selectedBinding, setSelectedBinding] = React.useState<Binding | null>(null);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Standard Layout (4 visible) */}
      <section style={{ border: '1px solid #E6EAF2', borderRadius: '12px', padding: '16px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
          Standard Layout (4 visible + overflow)
        </h3>
        <BindingsRow
          bindings={sampleBindings}
          maxVisible={4}
          onBindingClick={(binding) => setSelectedBinding(binding)}
        />
        {selectedBinding && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#6B7280' }}>
            Selected: {selectedBinding.type} - {selectedBinding.name}
          </p>
        )}
      </section>

      {/* XL Layout (6 visible) */}
      <section style={{ border: '1px solid #E6EAF2', borderRadius: '12px', padding: '16px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
          XL Layout (6 visible + overflow)
        </h3>
        <BindingsRow
          bindings={sampleBindings}
          maxVisible={6}
          onBindingClick={(binding) => console.log('XL clicked:', binding)}
        />
      </section>

      {/* No Overflow (All visible) */}
      <section style={{ border: '1px solid #E6EAF2', borderRadius: '12px', padding: '16px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
          No Overflow (All visible)
        </h3>
        <BindingsRow
          bindings={sampleBindings.slice(0, 3)}
          maxVisible={4}
          onBindingClick={(binding) => console.log('Clicked:', binding)}
        />
      </section>

      {/* Read-only (No onClick) */}
      <section style={{ border: '1px solid #E6EAF2', borderRadius: '12px', padding: '16px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
          Read-only Mode (No onClick)
        </h3>
        <BindingsRow
          bindings={sampleBindings.slice(0, 5)}
          maxVisible={4}
        />
      </section>

      {/* Empty State */}
      <section style={{ border: '1px solid #E6EAF2', borderRadius: '12px', padding: '16px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
          Empty State (No bindings - should not render)
        </h3>
        <BindingsRow
          bindings={[]}
          maxVisible={4}
        />
        <p style={{ fontSize: '14px', color: '#6B7280', fontStyle: 'italic' }}>
          Component returns null when bindings array is empty
        </p>
      </section>
    </div>
  );
}
