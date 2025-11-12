import Fuse from 'fuse.js';
import { EnhancedModel, ModelFilter, ModelGroup, ModelCapability } from './types';

/**
 * Creates a Fuse.js instance for fuzzy searching models
 */
export function createModelSearchEngine(models: EnhancedModel[]) {
  return new Fuse(models, {
    keys: [
      { name: 'display_name', weight: 0.8 },
      { name: 'model_key', weight: 0.7 },
      { name: 'provider', weight: 0.6 },
      { name: 'family', weight: 0.5 },
      { name: 'description', weight: 0.4 },
      { name: 'capabilities.name', weight: 0.3 },
      { name: 'tags.name', weight: 0.2 },
    ],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
  });
}

/**
 * Applies filters to the model list
 */
export function applyModelFilters(models: EnhancedModel[], filters: ModelFilter): EnhancedModel[] {
  return models.filter(model => {
    // Provider filter
    if (filters.providers.length > 0 && !filters.providers.includes(model.provider)) {
      return false;
    }

    // Capabilities filter
    if (filters.capabilities.length > 0) {
      const modelCapabilities = model.capabilities.map(cap => cap.id);
      const hasRequiredCapability = filters.capabilities.some(cap =>
        modelCapabilities.includes(cap)
      );
      if (!hasRequiredCapability) return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(model.status)) {
      return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const modelTags = model.tags.map(tag => tag.id);
      const hasRequiredTag = filters.tags.some(tag => modelTags.includes(tag));
      if (!hasRequiredTag) return false;
    }

    // Price range filter (if pricing available)
    if (model.pricing?.input_cost_per_token) {
      const cost = model.pricing.input_cost_per_token;
      if (cost < filters.priceRange[0] || cost > filters.priceRange[1]) {
        return false;
      }
    }

    // Context window range filter
    if (model.context_window) {
      const contextWindow = model.context_window;
      if (contextWindow < filters.contextWindowRange[0] || contextWindow > filters.contextWindowRange[1]) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Groups models by provider
 */
export function groupModelsByProvider(models: EnhancedModel[]): ModelGroup[] {
  const grouped = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = {
        provider: model.provider,
        models: [],
        logoUrl: model.logoUrl,
      };
    }
    acc[model.provider].models.push(model);
    return acc;
  }, {} as Record<string, ModelGroup>);

  return Object.values(grouped).sort((a, b) =>
    a.provider.localeCompare(b.provider)
  );
}

/**
 * Gets highlighted text segments for search matches
 */
export function getHighlightedSegments(text: string, matches: readonly any[]): Array<{text: string, highlighted: boolean}> {
  if (!matches || matches.length === 0) return [{text, highlighted: false}];

  const match = matches.find(m => m.value === text);
  if (!match || !match.indices) return [{text, highlighted: false}];

  const indices = match.indices;
  const segments: Array<{text: string, highlighted: boolean}> = [];
  let lastIndex = 0;

  indices.forEach(([start, end]: [number, number]) => {
    // Add text before match
    if (start > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, start),
        highlighted: false
      });
    }

    // Add highlighted match
    segments.push({
      text: text.slice(start, end + 1),
      highlighted: true
    });

    lastIndex = end + 1;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      highlighted: false
    });
  }

  return segments;
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Gets unique providers from model list
 */
export function getUniqueProviders(models: EnhancedModel[]): string[] {
  return Array.from(new Set(models.map(model => model.provider))).sort();
}

/**
 * Gets unique capabilities from model list
 */
export function getUniqueCapabilities(models: EnhancedModel[]): ModelCapability[] {
  const capabilityMap = new Map<string, ModelCapability>();

  models.forEach(model => {
    model.capabilities.forEach(cap => {
      if (!capabilityMap.has(cap.id)) {
        capabilityMap.set(cap.id, cap);
      }
    });
  });

  return Array.from(capabilityMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gets price range from model list
 */
export function getPriceRange(models: EnhancedModel[]): [number, number] {
  const prices = models
    .map(model => model.pricing?.input_cost_per_token)
    .filter((price): price is number => price !== undefined);

  if (prices.length === 0) return [0, 1];

  return [Math.min(...prices), Math.max(...prices)];
}

/**
 * Gets context window range from model list
 */
export function getContextWindowRange(models: EnhancedModel[]): [number, number] {
  const windows = models
    .map(model => model.context_window)
    .filter((window): window is number => window !== undefined);

  if (windows.length === 0) return [0, 200000];

  return [Math.min(...windows), Math.max(...windows)];
}

/**
 * Formats model display text
 */
export function formatModelDisplay(model: EnhancedModel): string {
  if (model.short_label) return model.short_label;
  if (model.display_name !== model.model_key) {
    return `${model.display_name} (${model.model_key})`;
  }
  return model.display_name;
}

/**
 * Gets model status badge variant
 */
export function getModelStatusVariant(status: EnhancedModel['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'beta':
      return 'secondary';
    case 'deprecated':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Creates initial filter state
 */
export function createInitialFilters(): ModelFilter {
  return {
    search: '',
    providers: [],
    capabilities: [],
    modelTypes: [],
    status: [],
    tags: [],
    priceRange: [0, 1],
    contextWindowRange: [0, 200000],
  };
}
