/**
 * Provider Card Component - Phase 2 Models Integration
 *
 * Displays provider information with statistics, health indicators, and branding.
 * Shows model counts, service level, health status, and trust scores.
 *
 * Architecture:
 * - Uses @meaty/ui design system components
 * - Displays provider logos and branding
 * - Shows health status with visual indicators
 * - Interactive provider statistics and metadata
 */

'use client';

import React from 'react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Separator } from '../Separator';
import { Tooltip } from '../Tooltip';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  ExternalLinkIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  GlobeIcon,
  CalendarIcon
} from 'lucide-react';

// ===== TYPE DEFINITIONS =====

export interface ProviderData {
  provider_name: string;
  display_name: string;
  description: string;
  website_url?: string;
  documentation_url?: string;
  logo_url?: string;
  model_count: number;
  health_status: 'operational' | 'degraded' | 'outage';
  health_last_checked?: string;
  service_level: 'enterprise' | 'professional' | 'community';
  pricing_model: 'pay-per-token' | 'subscription' | 'freemium';
  regions_supported?: string[];
  api_version?: string;
  trust_score?: number;
  established_date?: string;
  provider_statistics?: {
    total_models: number;
    model_types: Record<string, number>;
    modalities: Record<string, number>;
    avg_context_window: number;
    pricing_tiers: Record<string, number>;
    last_model_added?: string;
    context_window_range?: {
      min: number;
      max: number;
    };
  };
  health_details?: {
    api_latency: string;
    uptime_percentage: number;
    last_incident?: string;
    status_page?: string;
  };
}

export interface ProviderCardProps {
  /** Enhanced provider data from backend */
  providerData: ProviderData;
  /** Show detailed statistics */
  showStatistics?: boolean;
  /** Show health details */
  showHealthDetails?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Click handler for provider selection */
  onProviderClick?: (provider: ProviderData) => void;
  /** Custom className */
  className?: string;
}

// ===== UTILITY FUNCTIONS =====

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  });
};

const getHealthStatusColor = (status: string): string => {
  switch (status) {
    case 'operational':
      return '#10B981'; // Green
    case 'degraded':
      return '#F59E0B'; // Amber
    case 'outage':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

const getHealthStatusIcon = (status: string) => {
  switch (status) {
    case 'operational':
      return <CheckCircleIcon className="h-4 w-4" />;
    case 'degraded':
      return <AlertTriangleIcon className="h-4 w-4" />;
    case 'outage':
      return <XCircleIcon className="h-4 w-4" />;
    default:
      return <CheckCircleIcon className="h-4 w-4" />;
  }
};

const getServiceLevelBadgeVariant = (level: string) => {
  switch (level) {
    case 'enterprise':
      return 'default'; // Green
    case 'professional':
      return 'secondary'; // Blue
    case 'community':
      return 'outline'; // Gray
    default:
      return 'outline';
  }
};

const getTrustScoreColor = (score?: number): string => {
  if (!score) return '#6B7280';
  if (score >= 0.9) return '#10B981'; // Green
  if (score >= 0.8) return '#3B82F6'; // Blue
  if (score >= 0.7) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
};

// ===== SUBCOMPONENTS =====

const ProviderHeader: React.FC<{
  providerData: ProviderData;
  onProviderClick?: (provider: ProviderData) => void;
}> = ({ providerData, onProviderClick }) => (
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-3">
      {/* Provider Logo */}
      {providerData.logo_url && (
        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
          <img
            src={providerData.logo_url}
            alt={`${providerData.display_name} logo`}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3
            className={`font-semibold text-lg ${
              onProviderClick ? 'cursor-pointer hover:text-primary' : ''
            }`}
            onClick={() => onProviderClick?.(providerData)}
          >
            {providerData.display_name}
          </h3>
          <Badge
            variant={getServiceLevelBadgeVariant(providerData.service_level)}
            className="text-xs capitalize"
          >
            {providerData.service_level}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {providerData.description}
        </p>
      </div>
    </div>

    {/* External Links */}
    <div className="flex gap-1">
      {providerData.website_url && (
        <Tooltip content={`Visit ${providerData.display_name} website`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(providerData.website_url, '_blank')}
            className="h-8 w-8 p-0"
          >
            <GlobeIcon className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}
      {providerData.documentation_url && (
        <Tooltip content="View documentation">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(providerData.documentation_url, '_blank')}
            className="h-8 w-8 p-0"
          >
            <ExternalLinkIcon className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}
    </div>
  </div>
);

const HealthStatusIndicator: React.FC<{
  healthStatus: string;
  healthDetails?: ProviderData['health_details'];
  healthLastChecked?: string;
}> = ({ healthStatus, healthDetails, healthLastChecked }) => (
  <div className="flex items-center gap-2">
    <div
      className="flex items-center gap-1"
      style={{ color: getHealthStatusColor(healthStatus) }}
    >
      {getHealthStatusIcon(healthStatus)}
      <span className="text-sm capitalize font-medium">{healthStatus}</span>
    </div>

    {healthDetails && (
      <Tooltip content={
        `Uptime: ${healthDetails.uptime_percentage}% - Latency: ${healthDetails.api_latency}${healthLastChecked ? ` - Last checked: ${new Date(healthLastChecked).toLocaleTimeString()}` : ''}`
      }>
        <div className="text-xs text-muted-foreground">
          {healthDetails.api_latency}
        </div>
      </Tooltip>
    )}
  </div>
);

const ProviderStatistics: React.FC<{
  statistics: ProviderData['provider_statistics'];
}> = ({ statistics }) => {
  if (!statistics) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Statistics</h4>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Models</div>
          <div className="font-medium">{statistics.total_models}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Avg Context</div>
          <div className="font-medium">
            {formatNumber(statistics.avg_context_window)}
          </div>
        </div>
      </div>

      {/* Model Types Breakdown */}
      {Object.keys(statistics.model_types).length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Model Types</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(statistics.model_types)
              .slice(0, 3)
              .map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}: {count}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {/* Pricing Tiers */}
      {Object.keys(statistics.pricing_tiers).length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Pricing Tiers</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(statistics.pricing_tiers).map(([tier, count]) => (
              <Badge key={tier} variant="secondary" className="text-xs capitalize">
                {tier}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProviderMetadata: React.FC<{
  providerData: ProviderData;
}> = ({ providerData }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4 text-sm">
      {/* Model Count */}
      <div className="flex items-center gap-2">
        <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="text-muted-foreground">Models</div>
          <div className="font-medium">{providerData.model_count}</div>
        </div>
      </div>

      {/* Trust Score */}
      {providerData.trust_score && (
        <div className="flex items-center gap-2">
          <ShieldCheckIcon
            className="h-4 w-4"
            style={{ color: getTrustScoreColor(providerData.trust_score) }}
          />
          <div>
            <div className="text-muted-foreground">Trust Score</div>
            <div className="font-medium">
              {Math.round(providerData.trust_score * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Established Date */}
      {providerData.established_date && (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-muted-foreground">Established</div>
            <div className="font-medium">
              {formatDate(providerData.established_date)}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Model */}
      <div>
        <div className="text-muted-foreground">Pricing</div>
        <div className="font-medium capitalize">
          {providerData.pricing_model.replace('-', ' ')}
        </div>
      </div>
    </div>

    {/* Regions */}
    {providerData.regions_supported && providerData.regions_supported.length > 0 && (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Regions</div>
        <div className="flex flex-wrap gap-1">
          {providerData.regions_supported.map((region) => (
            <Badge key={region} variant="outline" className="text-xs uppercase">
              {region}
            </Badge>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ===== MAIN COMPONENT =====

export const ProviderCard: React.FC<ProviderCardProps> = ({
  providerData,
  showStatistics = true,
  showHealthDetails = true,
  compact = false,
  onProviderClick,
  className = '',
}) => {
  if (compact) {
    return (
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <ProviderHeader
              providerData={providerData}
              onProviderClick={onProviderClick}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {providerData.model_count} models
              </div>
              {showHealthDetails && (
                <HealthStatusIndicator
                  healthStatus={providerData.health_status}
                  healthDetails={providerData.health_details}
                  healthLastChecked={providerData.health_last_checked}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="pb-4">
        <ProviderHeader
          providerData={providerData}
          onProviderClick={onProviderClick}
        />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Health Status */}
        {showHealthDetails && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Service Status</div>
            <HealthStatusIndicator
              healthStatus={providerData.health_status}
              healthDetails={providerData.health_details}
              healthLastChecked={providerData.health_last_checked}
            />
          </div>
        )}

        <Separator />

        {/* Provider Metadata */}
        <ProviderMetadata providerData={providerData} />

        {/* Statistics */}
        {showStatistics && providerData.provider_statistics && (
          <>
            <Separator />
            <ProviderStatistics statistics={providerData.provider_statistics} />
          </>
        )}

        {/* API Version */}
        {providerData.api_version && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API Version</span>
              <Badge variant="outline" className="text-xs">
                v{providerData.api_version}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ===== EXPORT =====

export default ProviderCard;
