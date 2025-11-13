import * as React from 'react';
import { Package } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface VariablesRowProps {
  variables: Record<string, any>;
  maxVisible?: number;
  isCompact?: boolean;
}

export function VariablesRow({ variables, isCompact }: VariablesRowProps) {
  if (!variables || Object.keys(variables).length === 0) return null;

  const variableKeys = Object.keys(variables);

  // Safe stringification that handles potential React components or circular references
  let displayText: string;
  try {
    displayText = isCompact
      ? `{${variableKeys.join(', ')}}`
      : JSON.stringify(variables, (key, value) => {
          // Filter out any React components or functions
          if (typeof value === 'function' ||
              (value && typeof value === 'object' && ('$$typeof' in value || 'render' in value))) {
            return '[Component]';
          }
          return value;
        }, 2);
  } catch (error) {
    // Fallback for circular references or other stringify errors
    displayText = isCompact ? `{${variableKeys.join(', ')}}` : `{${variableKeys.length} variables}`;
  }

  return (
    <div className="flex items-start gap-2 px-3">
      <Package className="h-3.5 w-3.5 text-text-muted shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-text-muted">Variables:</span>
        <div className={cn(
          'mt-1 px-2 py-1 bg-mp-panel/20 rounded-mp-sm overflow-hidden',
          isCompact ? 'max-h-6' : 'max-h-20'
        )}>
          <code className={cn(
            'text-xs font-mono text-text-base',
            isCompact ? 'line-clamp-1' : 'block overflow-auto'
          )}>
            {displayText}
          </code>
        </div>
      </div>
    </div>
  );
}
