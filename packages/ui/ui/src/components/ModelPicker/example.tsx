/**
 * Example integration of ModelPicker with web app
 * This shows how to integrate with the existing useModels hook
 */
import * as React from 'react';
import { ModelPicker } from './ModelPicker';
import type { EnhancedModel } from './types';

// Mock of the web app's useModels hook
interface CatalogModel {
  id: string;
  provider: string;
  name: string;
  display_name: string;
  section: 'Official' | 'Yours';
  prompt_count?: number;
}

const mockUseModels = (token?: string, withCounts?: boolean) => {
  const [models, setModels] = React.useState<CatalogModel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setModels([
        {
          id: 'gpt-4-turbo',
          provider: 'OpenAI',
          name: 'gpt-4-turbo-preview',
          display_name: 'GPT-4 Turbo',
          section: 'Official',
          prompt_count: 150,
        },
        {
          id: 'claude-3-sonnet',
          provider: 'Anthropic',
          name: 'claude-3-sonnet-20240229',
          display_name: 'Claude 3 Sonnet',
          section: 'Official',
          prompt_count: 89,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, [token, withCounts]);

  return {
    data: models,
    isLoading: loading,
    error: error ? { message: error } : null,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Simulate refetch...
    }
  };
};

// Adapter function to convert CatalogModel to EnhancedModel
function adaptCatalogModelToEnhanced(catalogModel: CatalogModel): EnhancedModel {
  return {
    id: catalogModel.id,
    provider: catalogModel.provider,
    model_key: catalogModel.name,
    display_name: catalogModel.display_name,
    supports_tools: catalogModel.provider === 'OpenAI', // Mock logic
    supports_json_mode: catalogModel.provider === 'OpenAI',
    status: 'active',
    capabilities: [
      ...(catalogModel.provider === 'OpenAI' ? [
        { id: 'tools', name: 'Function Calling', description: 'Supports function calling' },
        { id: 'json', name: 'JSON Mode', description: 'Supports JSON output mode' }
      ] : []),
      ...(catalogModel.provider === 'Anthropic' ? [
        { id: 'vision', name: 'Vision', description: 'Can analyze images' }
      ] : []),
    ],
    performance: {
      latency: 'medium',
      cost: catalogModel.provider === 'OpenAI' ? 'high' : 'medium',
      quality: 'high',
    },
    tags: [],
    logoUrl: catalogModel.provider === 'OpenAI'
      ? 'https://openai.com/favicon.ico'
      : 'https://anthropic.com/favicon.ico',
    description: `${catalogModel.provider} model for various AI tasks`,
  };
}

// Example component using ModelPicker
export function ModelSelectionExample() {
  const { data: catalogModels = [], isLoading, error, refetch } = mockUseModels(undefined, true);
  const [selectedModel, setSelectedModel] = React.useState<string>('');

  // Convert catalog models to enhanced models
  const enhancedModels = React.useMemo(() =>
    catalogModels.map(adaptCatalogModelToEnhanced),
    [catalogModels]
  );

  const handleRetry = React.useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Model
        </label>
        <ModelPicker
          models={enhancedModels}
          value={selectedModel}
          onValueChange={(value) => setSelectedModel(value as string)}
          loading={isLoading}
          error={error?.message}
          onRetry={handleRetry}
          placeholder="Choose a model..."
          searchable
          filterable
        />
      </div>

      {selectedModel && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium">Selected Model:</h3>
          <p className="text-sm text-gray-600">{selectedModel}</p>
          <pre className="text-xs mt-2 bg-white p-2 rounded border overflow-x-auto">
            {JSON.stringify(
              enhancedModels.find(m => m.id === selectedModel),
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

// Example with multiple selection
export function MultipleModelSelectionExample() {
  const { data: catalogModels = [], isLoading, error } = mockUseModels();
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);

  const enhancedModels = React.useMemo(() =>
    catalogModels.map(adaptCatalogModelToEnhanced),
    [catalogModels]
  );

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Multiple Models
        </label>
        <ModelPicker
          models={enhancedModels}
          multiple
          value={selectedModels}
          onValueChange={(value) => setSelectedModels(value as string[])}
          loading={isLoading}
          error={error?.message}
          placeholder="Choose models..."
          searchable
          filterable
        />
      </div>

      {selectedModels.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium">Selected Models ({selectedModels.length}):</h3>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {selectedModels.map(id => (
              <li key={id}>{enhancedModels.find(m => m.id === id)?.display_name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
