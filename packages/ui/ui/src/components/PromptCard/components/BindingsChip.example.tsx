import * as React from 'react';
import { BindingsChip } from './BindingsChip';

/**
 * BindingsChip Example Usage
 *
 * Demonstrates the four binding types with different states and interactions.
 */

export function BindingsChipExample() {
  const [clickedChip, setClickedChip] = React.useState<string | null>(null);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* All Binding Types */}
      <section>
        <h3>Binding Types</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <BindingsChip
            type="context"
            name="API Documentation"
            onClick={() => setClickedChip('context')}
          />
          <BindingsChip
            type="agent"
            name="Code Reviewer"
            onClick={() => setClickedChip('agent')}
          />
          <BindingsChip
            type="variable"
            name="userName"
            onClick={() => setClickedChip('variable')}
          />
          <BindingsChip
            type="model"
            name="GPT-4 Turbo"
            onClick={() => setClickedChip('model')}
          />
        </div>
        {clickedChip && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#6B7280' }}>
            Clicked: {clickedChip}
          </p>
        )}
      </section>

      {/* Disabled State */}
      <section>
        <h3>Disabled State</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <BindingsChip
            type="context"
            name="API Documentation"
            disabled
          />
          <BindingsChip
            type="agent"
            name="Code Reviewer"
            disabled
          />
          <BindingsChip
            type="variable"
            name="userName"
            disabled
          />
          <BindingsChip
            type="model"
            name="GPT-4 Turbo"
            disabled
          />
        </div>
      </section>

      {/* Long Names - Text Overflow */}
      <section>
        <h3>Long Names (Text Overflow)</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '500px' }}>
          <BindingsChip
            type="context"
            name="Very Long API Documentation Context Name That Should Truncate"
            onClick={() => setClickedChip('long-context')}
          />
          <BindingsChip
            type="agent"
            name="Comprehensive Code Review and Analysis Agent"
            onClick={() => setClickedChip('long-agent')}
          />
        </div>
      </section>

      {/* Compact Layout */}
      <section>
        <h3>Compact Layout (Multiple Bindings)</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '600px' }}>
          <BindingsChip type="context" name="API Docs" />
          <BindingsChip type="context" name="Style Guide" />
          <BindingsChip type="agent" name="Reviewer" />
          <BindingsChip type="agent" name="Tester" />
          <BindingsChip type="variable" name="userName" />
          <BindingsChip type="variable" name="apiKey" />
          <BindingsChip type="model" name="GPT-4" />
          <BindingsChip type="model" name="Claude 3" />
        </div>
      </section>
    </div>
  );
}
