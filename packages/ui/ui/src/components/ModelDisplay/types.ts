import { EnhancedModel } from '../ModelPicker/types';

export interface ModelChipProps {
  model: EnhancedModel;
  variant?: 'default' | 'compact' | 'detailed';
  size?: 'sm' | 'default' | 'lg';
  showProvider?: boolean;
  showStatus?: boolean;
  showCapabilities?: boolean;
  showPricing?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export interface ModelTooltipProps {
  model: EnhancedModel;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  showFullDetails?: boolean;
  showMetrics?: boolean;
  className?: string;
}

export interface ModelCardProps {
  model: EnhancedModel;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  showMetrics?: boolean;
  showSuggestions?: boolean;
  onSelect?: () => void;
  onFavorite?: () => void;
  onCompare?: () => void;
  className?: string;
}

export interface ModelDeprecationWarningProps {
  model: EnhancedModel;
  variant?: 'inline' | 'banner' | 'modal';
  severity?: 'notice' | 'warning' | 'critical';
  showAlternatives?: boolean;
  showTimeline?: boolean;
  onDismiss?: () => void;
  onMigrate?: (alternativeModel: string) => void;
  className?: string;
}

export interface ModelMetrics {
  responseTime?: number;
  uptime?: number;
  satisfactionScore?: number;
  usageCount?: number;
  lastUsed?: string;
}

export interface ModelPriceTier {
  tier: 'free' | 'paid' | 'premium';
  label: string;
  color: 'default' | 'secondary' | 'success' | 'warning';
}

export interface CapabilityIcon {
  capability: string;
  icon: React.ReactNode;
  label: string;
}
