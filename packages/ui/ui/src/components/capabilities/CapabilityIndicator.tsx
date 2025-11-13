/**
 * Capability Indicator Component - Phase 2 Models Integration
 *
 * Displays model capabilities with confidence scoring and visual indicators.
 * Provides detailed capability information with modality support and limitations.
 *
 * Architecture:
 * - Uses @meaty/ui design system components
 * - Shows confidence levels with visual indicators
 * - Displays modality support and limitations
 * - Interactive tooltips for detailed information
 */

'use client';

import React from 'react';
import { Badge } from '../Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Separator } from '../Separator';
import { Tooltip } from '../Tooltip';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  XCircleIcon,
  InfoIcon,
  TrendingUpIcon,
  StarIcon
} from 'lucide-react';

// ===== TYPE DEFINITIONS =====

export interface CapabilityData {
  capability_type: string;
  enabled: boolean;
  confidence_score: number;
  confidence_level: 'low' | 'medium' | 'high' | 'expert';
  configuration?: Record<string, any>;
  modality_support?: string[];
  limitations?: string[];
  benchmarks?: {
    evaluation_criteria: string[];
    scores: Record<string, number>;
  };
}

export interface CapabilitiesData {
  model_id: string;
  capabilities: CapabilityData[];
  capability_confidence_summary: {
    average_confidence: number;
    confidence_distribution: Record<string, number>;
    total_capabilities: number;
    high_confidence_count: number;
  };
  modality_breakdown?: Record<string, string[]>;
  recommended_use_cases?: Array<{
    name: string;
    description: string;
    confidence: string;
    requirements: string[];
  }>;
  confidence_methodology?: {
    version: string;
    approach: string;
    factors: string[];
    scale: Record<string, string>;
  };
}

// ===== COMPONENT PROPS =====

export interface CapabilityIndicatorProps {
  /** Enhanced capabilities data from backend */
  capabilitiesData: CapabilitiesData;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Show modality breakdown */
  showModalities?: boolean;
  /** Show use case recommendations */
  showRecommendations?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

// ===== UTILITY FUNCTIONS =====

const formatCapabilityName = (type: string): string => {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getConfidenceColor = (level: string): string => {
  switch (level) {
    case 'expert':
      return '#10B981'; // Green
    case 'high':
      return '#3B82F6'; // Blue
    case 'medium':
      return '#F59E0B'; // Amber
    case 'low':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

const getConfidenceIcon = (level: string) => {
  switch (level) {
    case 'expert':
      return <StarIcon className="h-4 w-4" />;
    case 'high':
      return <CheckCircleIcon className="h-4 w-4" />;
    case 'medium':
      return <AlertCircleIcon className="h-4 w-4" />;
    case 'low':
      return <XCircleIcon className="h-4 w-4" />;
    default:
      return <InfoIcon className="h-4 w-4" />;
  }
};

const getConfidenceBadgeVariant = (level: string) => {
  switch (level) {
    case 'expert':
      return 'default'; // Green
    case 'high':
      return 'secondary'; // Blue
    case 'medium':
      return 'outline'; // Amber
    case 'low':
      return 'destructive'; // Red
    default:
      return 'outline';
  }
};

// ===== SUBCOMPONENTS =====

const CapabilityItem: React.FC<{
  capability: CapabilityData;
  showDetails: boolean;
}> = ({ capability, showDetails }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
    <div
      className="flex items-center justify-center w-8 h-8 rounded-full mt-0.5"
      style={{ backgroundColor: `${getConfidenceColor(capability.confidence_level)}20` }}
    >
      <div style={{ color: getConfidenceColor(capability.confidence_level) }}>
        {getConfidenceIcon(capability.confidence_level)}
      </div>
    </div>

    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {formatCapabilityName(capability.capability_type)}
          </span>
          <Badge
            variant={getConfidenceBadgeVariant(capability.confidence_level)}
            className="text-xs capitalize"
          >
            {capability.confidence_level}
          </Badge>
        </div>
        <Tooltip content={`Confidence Score: ${capability.confidence_score.toFixed(3)}`}>
          <div className="text-xs font-mono px-2 py-1 bg-background rounded border">
            {Math.round(capability.confidence_score * 100)}%
          </div>
        </Tooltip>
      </div>

      {showDetails && (
        <>
          {/* Modality Support */}
          {capability.modality_support && capability.modality_support.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Modalities:</span>
              <div className="flex gap-1">
                {capability.modality_support.map((modality, index) => (
                  <Badge key={index} variant="outline" className="text-xs capitalize">
                    {modality}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Benchmarks */}
          {capability.benchmarks?.scores && Object.keys(capability.benchmarks.scores).length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Benchmarks:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(capability.benchmarks.scores).map(([metric, score]) => (
                  <div key={metric} className="flex justify-between">
                    <span className="capitalize">{metric.replace('_', ' ')}</span>
                    <span className="font-mono">{Math.round(score * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations */}
          {capability.limitations && capability.limitations.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Limitations:</span>
              <ul className="text-xs space-y-1">
                {capability.limitations.slice(0, 2).map((limitation, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

const ConfidenceSummary: React.FC<{
  summary: CapabilitiesData['capability_confidence_summary'];
}> = ({ summary }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Overall Confidence</span>
      <div className="flex items-center gap-2">
        <TrendingUpIcon className="h-4 w-4 text-green-600" />
        <span className="font-mono text-sm">
          {Math.round(summary.average_confidence * 100)}%
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <div className="text-muted-foreground">High Confidence</div>
        <div className="font-medium">
          {summary.high_confidence_count} / {summary.total_capabilities}
        </div>
      </div>
      <div>
        <div className="text-muted-foreground">Total Capabilities</div>
        <div className="font-medium">{summary.total_capabilities}</div>
      </div>
    </div>

    {/* Confidence Distribution */}
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">Confidence Distribution</div>
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
        {Object.entries(summary.confidence_distribution).map(([level, count]) => {
          const percentage = (count / summary.total_capabilities) * 100;
          if (percentage === 0) return null;

          return (
            <div
              key={level}
              className="h-full"
              style={{
                width: `${percentage}%`,
                backgroundColor: getConfidenceColor(level)
              }}
              title={`${level}: ${count} capabilities`}
            />
          );
        })}
      </div>
    </div>
  </div>
);

const ModalityBreakdown: React.FC<{
  breakdown: Record<string, string[]>;
}> = ({ breakdown }) => (
  <div className="space-y-3">
    <h4 className="font-medium text-sm">Supported Modalities</h4>
    <div className="grid gap-3">
      {Object.entries(breakdown).map(([modality, capabilities]) => (
        <div key={modality} className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {modality}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {capabilities.length} capabilities
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {capabilities.slice(0, 3).map((cap, index) => (
              <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                {formatCapabilityName(cap)}
              </span>
            ))}
            {capabilities.length > 3 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{capabilities.length - 3} more
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RecommendedUseCases: React.FC<{
  useCases: CapabilitiesData['recommended_use_cases'];
}> = ({ useCases }) => {
  if (!useCases || useCases.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Recommended Use Cases</h4>
      <div className="grid gap-2">
        {useCases.slice(0, 3).map((useCase, index) => (
          <div key={index} className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{useCase.name}</span>
              <Badge
                variant={useCase.confidence === 'high' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {useCase.confidence}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{useCase.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====

export const CapabilityIndicator: React.FC<CapabilityIndicatorProps> = ({
  capabilitiesData,
  showDetails = true,
  showModalities = true,
  showRecommendations = true,
  compact = false,
  className = '',
}) => {
  const {
    capabilities,
    capability_confidence_summary,
    modality_breakdown,
    recommended_use_cases,
  } = capabilitiesData;

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <ConfidenceSummary summary={capability_confidence_summary} />
        <div className="grid gap-2">
          {capabilities.slice(0, 3).map((capability, index) => (
            <CapabilityItem
              key={index}
              capability={capability}
              showDetails={false}
            />
          ))}
          {capabilities.length > 3 && (
            <div className="text-xs text-muted-foreground text-center py-2">
              +{capabilities.length - 3} more capabilities
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span>Capabilities</span>
          <Tooltip content="Capability confidence scores are based on model architecture, training data, and benchmark performance.">
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </Tooltip>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Confidence Summary */}
        <ConfidenceSummary summary={capability_confidence_summary} />

        <Separator />

        {/* Capabilities List */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Individual Capabilities</h4>
          <div className="grid gap-3">
            {capabilities.map((capability, index) => (
              <CapabilityItem
                key={index}
                capability={capability}
                showDetails={showDetails}
              />
            ))}
          </div>
        </div>

        {/* Modality Breakdown */}
        {showModalities && modality_breakdown && (
          <>
            <Separator />
            <ModalityBreakdown breakdown={modality_breakdown} />
          </>
        )}

        {/* Recommended Use Cases */}
        {showRecommendations && (
          <>
            <Separator />
            <RecommendedUseCases useCases={recommended_use_cases} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ===== EXPORT =====

export default CapabilityIndicator;
