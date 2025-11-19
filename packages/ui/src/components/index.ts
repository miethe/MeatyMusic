// Core UI Components
export * from './Avatar';
export * from './Button';
export * from './Command';
export * from './Input';
export * from './SearchInput';
export * from './TagSelect';
export * from './Textarea';
export * from './Label';
export * from './Card';
export * from './Checkbox';
export * from './ConfirmDialog';
export * from './Dialog';
export * from './DropdownMenu';
export * from './Popover';
export * from './Switch';
export * from './Separator';
export * from './Alert';
export * from './Form';
export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from './Select';
export * from './Collapsible';
export * from './Tooltip';
export * from './RadioGroup';
export * from './Sheet';
export * from './NavigationTabs';
export * from './Slider';
export * from './Tabs';
export * from './SegmentedControl';
export * from './Progress';
export * from './DatePicker';

// Specialized Components
export * from './Badge';
export * from './Chip';
export * from './ChipSelector';
export * from './Toast';
export * from './Skeleton';

// DISABLED: MeatyPrompts-specific components causing TypeScript errors
// TODO: Remove or adapt these components for AMCS when needed
// export * from './PromptCard';
// export * from './TemplateCard';
// export * from './ContextCard';
// export * from './AgentCard';

export * from './Sidebar';

// DISABLED: MeatyPrompts-specific model components causing TypeScript errors
// TODO: Replace with AMCS-specific engine/style components when needed
// export * from './ModelFilter';
// export * from './ModelPicker';
// export * from './ModelDisplay';

export * from './MarkdownEditor';
export * from './SaveStatusIndicator';
export * from './DraftBanner';

// Phase 3 - Foundation Components
export * from './EmptyState';
export * from './ErrorDisplay';
export * from './LoadingScreen';
export * from './PageHeader';
export * from './BulkActions';
export * from './FileUpload';

// Phase 3 Week 8 - Enhanced Model Components
export * from './CapabilityBadge';
export * from './PricingDisplay';

// Pricing Components - Phase 2 - TEMPORARILY DISABLED due to webpack export conflicts
// TODO: Re-enable after fixing star export conflicts
// export * from './pricing/PricingDisplay';
// export * from './pricing/CostCalculator';

// Capabilities Components - Phase 2 - TEMPORARILY DISABLED due to webpack export conflicts
// TODO: Re-enable after fixing star export conflicts
// export * from './capabilities/CapabilityIndicator';
// export * from './capabilities/CapabilityFilter';

// Provider Components - Phase 2 - TEMPORARILY DISABLED due to webpack export conflicts
// TODO: Re-enable after fixing star export conflicts
// export * from './providers/ProviderCard';
// export * from './providers/ProviderGrid';

// Analytics Components
export * from './Chart';
export * from './MetricCard';

// Modal Alias for Dialog (semantic clarity)
export {
  Dialog as Modal,
  DialogPortal as ModalPortal,
  DialogOverlay as ModalOverlay,
  DialogTrigger as ModalTrigger,
  DialogClose as ModalClose,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogFooter as ModalFooter,
  DialogTitle as ModalTitle,
  DialogDescription as ModalDescription,
} from './Dialog';

// Legacy exports for backward compatibility
// Card is now exported from './Card' on line 10
export { ErrorLayout } from '../error-layout';
export {
  ErrorFallback,
  NetworkErrorFallback,
  NotFoundErrorFallback,
  LoadingErrorFallback,
  PermissionErrorFallback,
  type ErrorFallbackProps
} from '../error-fallback';
export { AuthForm, type AuthFormProps } from '../auth-form';
export {
  LoadingSkeleton as LegacyLoadingSkeleton,
  AuthFormSkeleton,
  ButtonSkeleton,
  type LoadingSkeletonProps
} from '../loading-skeleton';
export {
  SessionWarning,
  Toast as LegacyToast,
  type SessionWarningProps,
  type ToastProps as LegacyToastProps
} from '../session-warning';

// DISABLED: MeatyPrompts-specific PromptCard complications causing TypeScript errors
// TODO: Remove or replace with AMCS-specific complications when needed
// export * from './PromptCard/complications';
