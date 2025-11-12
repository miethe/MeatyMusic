/**
 * ProviderBadge Usage Examples
 *
 * This file demonstrates how to use the ProviderBadge component
 * both as a standalone component and as a PromptCard complication.
 */

import * as React from 'react';
import { ProviderBadge, type Provider } from './ProviderBadge';
import type { ComplicationProps } from '../../../complications/types';

// Mock complication context for standalone usage
const mockComplicationContext: Omit<ComplicationProps, 'slot'> = {
  cardId: 'example-card',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Example Prompt',
  isFocused: false,
  isVisible: true,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false,
  },
};

/**
 * Example 1: Basic standalone usage
 */
export function BasicExample() {
  return (
    <ProviderBadge
      {...mockComplicationContext}
      slot="topLeft"
      provider="anthropic"
      modelName="claude-3-5-sonnet"
    />
  );
}

/**
 * Example 2: Interactive provider badge
 */
export function InteractiveExample() {
  const handleProviderClick = () => {
    console.log('Provider details clicked');
    // Open provider settings modal, etc.
  };

  return (
    <ProviderBadge
      {...mockComplicationContext}
      slot="topLeft"
      provider="openai"
      modelName="gpt-4"
      onClick={handleProviderClick}
    />
  );
}

/**
 * Example 3: Responsive sizes
 */
export function ResponsiveSizesExample() {
  return (
    <div className="space-y-4">
      <div>
        <h3>Compact</h3>
        <ProviderBadge
          {...mockComplicationContext}
          cardSize="compact"
          slot="topLeft"
          provider="google"
          modelName="gemini-pro"
        />
      </div>

      <div>
        <h3>Standard</h3>
        <ProviderBadge
          {...mockComplicationContext}
          cardSize="standard"
          slot="topLeft"
          provider="google"
          modelName="gemini-pro"
        />
      </div>

      <div>
        <h3>XL</h3>
        <ProviderBadge
          {...mockComplicationContext}
          cardSize="xl"
          slot="topLeft"
          provider="google"
          modelName="gemini-pro"
        />
      </div>
    </div>
  );
}

/**
 * Example 4: All providers showcase
 */
export function AllProvidersExample() {
  const providers: Array<{ provider: Provider; model: string }> = [
    { provider: 'openai', model: 'gpt-4' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet' },
    { provider: 'google', model: 'gemini-pro' },
    { provider: 'meta', model: 'llama-3-70b' },
    { provider: 'cohere', model: 'command-r-plus' },
    { provider: 'custom', model: 'custom-llm-v1' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {providers.map(({ provider, model }) => (
        <ProviderBadge
          key={provider}
          {...mockComplicationContext}
          slot="topLeft"
          provider={provider}
          modelName={model}
        />
      ))}
    </div>
  );
}

/**
 * Example 5: Integration with PromptCard complications system
 *
 * Note: This is pseudocode showing the intended usage pattern.
 * The actual PromptCard implementation would handle spreading these props.
 */
export function PromptCardIntegrationExample() {
  // In actual usage, you would use the PromptCard component like this:
  /*
  import { PromptCard, ProviderBadge } from '@meaty/ui';

  <PromptCard
    title="My Prompt"
    description="A prompt for generating code"
    complications={{
      topLeft: {
        component: ProviderBadge,
        // Additional props specific to ProviderBadge
        // These will be passed to the component along with ComplicationProps
      }
    }}
    // ... other PromptCard props
  />
  */

  return (
    <div className="p-4 border rounded-lg">
      <div className="relative">
        {/* Top left slot - Provider Badge */}
        <div className="absolute top-2 left-2">
          <ProviderBadge
            {...mockComplicationContext}
            slot="topLeft"
            provider="anthropic"
            modelName="claude-3-5-sonnet"
          />
        </div>

        {/* Card content */}
        <div className="pt-10 px-4 pb-4">
          <h2 className="text-lg font-semibold">Code Generation Prompt</h2>
          <p className="text-sm text-gray-600 mt-2">
            Generate high-quality, well-documented code based on requirements
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 6: Dynamic provider based on data
 */
export function DynamicProviderExample() {
  const [promptData] = React.useState({
    provider: 'anthropic' as Provider,
    model: 'claude-3-5-sonnet',
    title: 'My Prompt',
  });

  return (
    <ProviderBadge
      {...mockComplicationContext}
      slot="topLeft"
      provider={promptData.provider}
      modelName={promptData.model}
    />
  );
}

/**
 * Example 7: Conditional rendering
 */
export function ConditionalRenderingExample() {
  const [showProvider, setShowProvider] = React.useState(true);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowProvider(!showProvider)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Toggle Provider Badge
      </button>

      <ProviderBadge
        {...mockComplicationContext}
        slot="topLeft"
        provider="openai"
        modelName="gpt-4"
        isVisible={showProvider}
      />
    </div>
  );
}
