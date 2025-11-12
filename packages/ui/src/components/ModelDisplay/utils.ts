import { EnhancedModel } from '../ModelPicker/types';
import { ModelPriceTier, CapabilityIcon } from './types';

/**
 * Format price for display
 */
export function formatPrice(price: number, currency = 'USD'): string {
  if (price === 0) return 'Free';

  // Convert to per million tokens for better readability
  const pricePerMillion = price * 1_000_000;

  if (pricePerMillion < 1) {
    return `$${(pricePerMillion * 1000).toFixed(2)}/M tokens`;
  }

  return `$${pricePerMillion.toFixed(2)}/M tokens`;
}

/**
 * Get model price tier information
 */
export function getModelPriceTier(model: EnhancedModel): ModelPriceTier {
  const inputCost = model.pricing?.input_cost_per_token || 0;

  if (inputCost === 0) {
    return { tier: 'free', label: 'Free', color: 'success' };
  } else if (inputCost < 0.000010) { // Less than $10 per million tokens
    return { tier: 'paid', label: 'Standard', color: 'secondary' };
  } else {
    return { tier: 'premium', label: 'Premium', color: 'warning' };
  }
}

/**
 * Get capability icons mapping
 */
export function getCapabilityIcons(): Record<string, CapabilityIcon> {
  return {
    vision: {
      capability: 'vision',
      icon: '👁️',
      label: 'Vision'
    },
    tools: {
      capability: 'tools',
      icon: '🔧',
      label: 'Tools'
    },
    json_mode: {
      capability: 'json_mode',
      icon: '{ }',
      label: 'JSON Mode'
    },
    streaming: {
      capability: 'streaming',
      icon: '⚡',
      label: 'Streaming'
    },
    multimodal: {
      capability: 'multimodal',
      icon: '🎭',
      label: 'Multimodal'
    },
    code: {
      capability: 'code',
      icon: '💻',
      label: 'Code'
    },
    reasoning: {
      capability: 'reasoning',
      icon: '🧠',
      label: 'Reasoning'
    }
  };
}

/**
 * Get model capabilities with icons
 */
export function getModelCapabilities(model: EnhancedModel): CapabilityIcon[] {
  const iconMap = getCapabilityIcons();
  const capabilities: CapabilityIcon[] = [];

  // Add explicit capabilities from the model
  model.capabilities.forEach(cap => {
    if (iconMap[cap.id]) {
      capabilities.push(iconMap[cap.id]);
    }
  });

  // Add implicit capabilities based on model properties
  if (model.supports_tools && !capabilities.find(c => c.capability === 'tools')) {
    capabilities.push(iconMap.tools);
  }

  if (model.supports_json_mode && !capabilities.find(c => c.capability === 'json_mode')) {
    capabilities.push(iconMap.json_mode);
  }

  // Check for vision capability in modalities
  if (model.modalities?.includes('vision') && !capabilities.find(c => c.capability === 'vision')) {
    capabilities.push(iconMap.vision);
  }

  return capabilities;
}

/**
 * Format context window for display
 */
export function formatContextWindow(contextWindow?: number): string {
  if (!contextWindow) return 'Unknown';

  if (contextWindow >= 1_000_000) {
    return `${(contextWindow / 1_000_000).toFixed(1)}M tokens`;
  } else if (contextWindow >= 1_000) {
    return `${(contextWindow / 1_000).toFixed(0)}K tokens`;
  }

  return `${contextWindow} tokens`;
}

/**
 * Get deprecation urgency level
 */
export function getDeprecationUrgency(model: EnhancedModel): 'notice' | 'warning' | 'critical' {
  if (!model.deprecation) return 'notice';

  const deprecatedAt = new Date(model.deprecation.deprecated_at);
  const now = new Date();
  const daysSinceDeprecation = Math.floor((now.getTime() - deprecatedAt.getTime()) / (1000 * 60 * 60 * 24));

  if (model.deprecation.end_of_life) {
    const endOfLife = new Date(model.deprecation.end_of_life);
    const daysUntilEOL = Math.floor((endOfLife.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilEOL <= 30) return 'critical';
    if (daysUntilEOL <= 90) return 'warning';
  }

  if (daysSinceDeprecation > 180) return 'warning';
  return 'notice';
}

/**
 * Get model display name with fallback
 */
export function getModelDisplayName(model: EnhancedModel): string {
  return model.short_label || model.display_name;
}

/**
 * Get provider logo fallback
 */
export function getProviderFallback(provider: string): string {
  const firstChar = provider.charAt(0).toUpperCase();
  return firstChar;
}

/**
 * Format performance metric
 */
export function formatPerformanceLevel(level: 'low' | 'medium' | 'high'): {
  label: string;
  color: 'success' | 'warning' | 'destructive';
} {
  switch (level) {
    case 'low':
      return { label: 'Low', color: 'success' };
    case 'medium':
      return { label: 'Medium', color: 'warning' };
    case 'high':
      return { label: 'High', color: 'destructive' };
  }
}

/**
 * Get model status badge variant
 */
export function getModelStatusBadgeVariant(status: EnhancedModel['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
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
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate accessible description for model
 */
export function getModelA11yDescription(model: EnhancedModel): string {
  const capabilities = getModelCapabilities(model);
  const capabilityNames = capabilities.map(c => c.label).join(', ');
  const status = model.status === 'deprecated' ? 'deprecated' : model.status;

  return `${getModelDisplayName(model)} by ${model.provider}. Status: ${status}. Capabilities: ${capabilityNames || 'None'}.`;
}
