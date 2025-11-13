export { AgentCard, agentCardVariants } from './AgentCard';
export type { AgentCardProps, AgentRuntime } from './AgentCard';

// Export section components with Agent prefix to avoid naming conflicts
export { Header as AgentHeader } from './sections/Header';
export type { AgentHeaderProps } from './sections/Header';

export { RuntimeBadge } from './sections/RuntimeBadge';
export type { RuntimeBadgeProps, RuntimeConfig } from './sections/RuntimeBadge';

export { EntryPromptPreview } from './sections/EntryPromptPreview';
export type { EntryPromptPreviewProps } from './sections/EntryPromptPreview';

export { ToolsRow as AgentToolsRow } from './sections/ToolsRow';
export type { ToolsRowProps, Tool } from './sections/ToolsRow';

export { VariablesRow as AgentVariablesRow } from './sections/VariablesRow';
export type { VariablesRowProps } from './sections/VariablesRow';

export { Actions as AgentActions } from './sections/Actions';
export type { AgentActionsProps } from './sections/Actions';

export { ErrorBanner as AgentErrorBanner } from './sections/ErrorBanner';
export type { ErrorBannerProps as AgentErrorBannerProps } from './sections/ErrorBanner';
