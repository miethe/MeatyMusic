import * as React from 'react';
import { CardContent } from '../../Card';
import { cn } from '../../../lib/utils';
import styles from '../PromptCard.module.css';
import { BlockChipsRow, ProvenanceRow, ExtendedStatsRow } from '../components';
import type { BlockChipsRowProps, ProvenanceRowProps, ExtendedStatsRowProps } from '../components';

export interface BodyProps {
  isCompact: boolean;
  isXL: boolean;
  bodyPreview?: string;
  blockChips?: BlockChipsRowProps['chips'];
  provenance?: ProvenanceRowProps;
  extendedStats?: ExtendedStatsRowProps & { successRateData?: number[]; avgCost?: number };
  metrics?: { successRate?: number; avgCost?: number };
  children?: React.ReactNode;
}

export function Body(props: BodyProps) {
  const { isXL, blockChips, provenance, extendedStats, metrics } = props;

  // This component is now only used for XL variant extended content
  // Body preview is handled by the BodyPreview component
  // Children (Stats/Actions) are now standalone rows
  if (!isXL) {
    return null;
  }

  return (
    <CardContent className={cn(styles.contentSpacing, 'pb-3')}>
      {blockChips && (
        <div className="mb-4">
          <BlockChipsRow chips={blockChips} />
        </div>
      )}

      {provenance && (
        <div className="mb-4">
          <ProvenanceRow {...provenance} />
        </div>
      )}

      {extendedStats && (
        <div className="mb-4">
          <ExtendedStatsRow
            successRateData={extendedStats.successRateData}
            successRate={metrics?.successRate}
            p50Latency={extendedStats.p50Latency}
            p95Latency={extendedStats.p95Latency}
            p50LatencyData={extendedStats.p50LatencyData}
            tokenUsageData={extendedStats.tokenUsageData}
            avgTokens={extendedStats.avgTokens}
            costData={extendedStats.costData}
            avgCost={metrics?.avgCost}
          />
        </div>
      )}
    </CardContent>
  );
}
