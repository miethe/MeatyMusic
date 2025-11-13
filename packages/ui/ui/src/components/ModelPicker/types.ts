export interface ModelCapability {
  id: string;
  name: string;
  description?: string;
}

export interface ModelPerformance {
  latency: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
  quality: 'low' | 'medium' | 'high';
}

export interface DeprecationInfo {
  deprecated_at: string;
  end_of_life?: string;
  replacement_model?: string;
  reason?: string;
}

export interface UserTag {
  id: string;
  name: string;
  color?: string;
  user_id: string;
  created_at: string;
}

export interface EnhancedModel {
  id: string;
  provider: string;
  model_key: string;
  display_name: string;
  short_label?: string;
  family?: string;
  modalities?: string[];
  context_window?: number;
  max_output_tokens?: number;
  supports_tools: boolean;
  supports_json_mode: boolean;
  status: 'active' | 'deprecated' | 'beta';
  pricing?: {
    input_cost_per_token?: number;
    output_cost_per_token?: number;
    currency?: string;
  };
  capabilities: ModelCapability[];
  performance: ModelPerformance;
  deprecation?: DeprecationInfo;
  tags: UserTag[];
  logoUrl?: string;
  description?: string;
}

export interface ModelPickerProps {
  /** Selected model ID(s) */
  value?: string | string[];
  /** Callback when selection changes */
  onValueChange: (value: string | string[]) => void;
  /** Allow multiple model selection */
  multiple?: boolean;
  /** Placeholder text for the trigger */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Filter models by specific providers */
  providers?: string[];
  /** Filter models by specific capabilities */
  capabilities?: string[];
  /** Whether to show search functionality */
  searchable?: boolean;
  /** Whether to show filter functionality */
  filterable?: boolean;
  /** Whether to show tagging functionality */
  taggable?: boolean;
  /** Whether to use virtualization for large lists */
  virtualized?: boolean;
  /** Maximum height of the dropdown */
  maxHeight?: string;
  /** Custom className */
  className?: string;
  /** Custom trigger content */
  children?: React.ReactNode;
}

export interface ModelFilter {
  search: string;
  providers: string[];
  capabilities: string[];
  modelTypes: string[];
  status: string[];
  tags: string[];
  priceRange: [number, number];
  contextWindowRange: [number, number];
}

export interface ModelGroup {
  provider: string;
  models: EnhancedModel[];
  logoUrl?: string;
}

export interface ModelPickerContextValue {
  // State
  models: EnhancedModel[];
  filteredModels: EnhancedModel[];
  selectedModels: string[];
  isOpen: boolean;
  searchQuery: string;
  filters: ModelFilter;
  loading: boolean;
  error: string | null;

  // Actions
  setIsOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<ModelFilter>) => void;
  selectModel: (modelId: string) => void;
  deselectModel: (modelId: string) => void;
  clearSelection: () => void;

  // Computed
  selectedModelData: EnhancedModel[];
  modelGroups: ModelGroup[];
  hasSelection: boolean;

  // Configuration
  multiple: boolean;
  searchable: boolean;
  filterable: boolean;
  taggable: boolean;
}
