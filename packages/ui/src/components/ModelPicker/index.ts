export { ModelPicker, ModelPickerRoot, ModelPickerTrigger, ModelPickerContent, useModelPickerContext } from './ModelPicker';
export { ModelPickerSearch } from './ModelPickerSearch';
export { ModelPickerFilters } from './ModelPickerFilters';
export { ModelPickerList } from './ModelPickerList';
export { ModelPickerItem } from './ModelPickerItem';
export { useModelPicker } from './hooks/useModelPicker';
export { useModelSearch } from './hooks/useModelSearch';
export { useModelFilters } from './hooks/useModelFilters';

export type {
  ModelPickerProps,
  EnhancedModel,
  ModelCapability,
  ModelPerformance,
  DeprecationInfo,
  UserTag,
  ModelFilter as ModelPickerFilter,
  ModelGroup as ModelPickerGroup,
  ModelPickerContextValue,
} from './types';

export {
  createModelSearchEngine,
  applyModelFilters,
  groupModelsByProvider,
  getHighlightedSegments,
  debounce,
  getUniqueProviders,
  getUniqueCapabilities,
  getPriceRange,
  getContextWindowRange,
  formatModelDisplay,
  getModelStatusVariant,
  createInitialFilters,
} from './utils';
