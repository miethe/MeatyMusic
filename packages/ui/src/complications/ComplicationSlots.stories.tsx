import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import React, { useState, useEffect } from 'react';
import { PromptCard } from '../components/PromptCard';
import { ComplicationSlotsComponent } from './ComplicationSlots';
import { ComplicationProvider, ComplicationDebugInfo } from './context';

// Import example complications
import { BadgeComplication, SuccessBadge, ErrorBadge, RunningBadge, NewBadge, StarBadge } from './examples/BadgeComplication';
import { SparklineComplication, SuccessRateSparkline, LatencySparkline, CostSparkline } from './examples/SparklineComplication';
import { StatusComplication, OnlineStatus, OfflineStatus, PendingStatus, ErrorStatus, SuccessStatus } from './examples/StatusComplication';
import { MetricComplication, SuccessRateMetric, LatencyMetric, CostMetric, UsageMetric } from './examples/MetricComplication';

import type { ComplicationSlots as ComplicationSlotsType, SlotPosition, CardState, CardSize, ComplicationProps } from './types';

const meta = {
  title: 'Components/PromptCard/Complications',
  component: ComplicationSlotsComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'The PromptCard Complications system provides a watch-face inspired slot system for micro-widgets around the card. Features 7 slot positions, type-safe API, error boundaries, and performance optimizations.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    debug: {
      control: { type: 'boolean' },
      description: 'Show debug information and slot boundaries',
    },
  },
} satisfies Meta<typeof ComplicationSlotsComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component to wrap complications in a card
interface ComplicationDemoProps {
  complications?: ComplicationSlotsType;
  cardSize?: CardSize;
  cardState?: CardState;
  debug?: boolean;
  title?: string;
}

function ComplicationDemo({
  complications = {},
  cardSize = 'standard',
  cardState = 'default',
  debug = false,
  title = 'Demo Card with Complications'
}: ComplicationDemoProps) {
  return (
    <div style={{ position: 'relative', padding: '40px' }}>
      <PromptCard
        size={cardSize}
        state={cardState}
        title={title}
        version={1}
        access="private"
        tags={['complications', 'demo']}
        model="gpt-4"
        lastRun={new Date(Date.now() - 1000 * 60 * 15)}
        bodyPreview="This card demonstrates the complications system with various micro-widgets positioned around the card."
        metrics={{
          runs: 42,
          successRate: 0.89,
          avgCost: 0.015,
          avgTime: 2.3
        }}
        complications={complications}
        onRun={fn()}
        onEdit={fn()}
        onFork={fn()}
        onMenuAction={fn()}
      />
      {debug && <ComplicationDebugInfo />}
    </div>
  );
}

// ============================================================================
// BASIC SLOT POSITIONING STORIES
// ============================================================================

export const AllSlotPositions: Story = {
  args: {
    debug: true,
  },
  render: (args: any) => {
    const complications: ComplicationSlotsType = {
      topLeft: {
        component: (props) => <BadgeComplication {...props} text="TL" variant="success" />,
      },
      topRight: {
        component: (props) => <BadgeComplication {...props} text="TR" variant="info" />,
      },
      bottomLeft: {
        component: (props) => <BadgeComplication {...props} text="BL" variant="warning" />,
      },
      bottomRight: {
        component: (props) => <BadgeComplication {...props} text="BR" variant="error" />,
      },
      edgeLeft: {
        component: (props) => <BadgeComplication {...props} text="L" variant="default" />,
      },
      edgeRight: {
        component: (props) => <BadgeComplication {...props} text="R" variant="default" />,
      },
      footer: {
        component: (props) => <BadgeComplication {...props} text="Footer" variant="info" />,
      },
    };

    return <ComplicationDemo complications={complications} debug={args.debug} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows all 7 slot positions with labeled badges: topLeft, topRight, bottomLeft, bottomRight, edgeLeft, edgeRight, and footer.',
      },
    },
  },
};

export const CardSizeVariants = {
  render: () => {
    const complications: ComplicationSlotsType = {
      topLeft: {
        component: SuccessBadge,
      },
      topRight: {
        component: (props) => <StatusComplication {...props} status="online" />,
      },
      bottomRight: {
        component: (props) => <MetricComplication {...props} value={89} unit="%" label="Success" />,
      },
      edgeRight: {
        component: (props) => <SparklineComplication {...props} data={[0.8, 0.9, 0.85, 0.92, 0.88, 0.94, 0.89]} variant="success" />,
      },
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '40px' }}>
        <div>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Compact Size</h3>
          <ComplicationDemo
            complications={complications}
            cardSize="compact"
            title="Compact Card"
          />
        </div>

        <div>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Standard Size</h3>
          <ComplicationDemo
            complications={complications}
            cardSize="standard"
            title="Standard Card"
          />
        </div>

        <div>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>XL Size</h3>
          <ComplicationDemo
            complications={complications}
            cardSize="xl"
            title="XL Card"
          />
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Demonstrates how complications adapt to different card sizes (compact, standard, xl) with appropriate scaling and positioning.',
      },
    },
  },
};

// ============================================================================
// COMPLICATION TYPE DEMONSTRATIONS
// ============================================================================

export const BadgeComplications = {
  render: () => {
    const complications: ComplicationSlotsType = {
      topLeft: { component: SuccessBadge },
      topRight: { component: ErrorBadge },
      bottomLeft: { component: RunningBadge },
      bottomRight: { component: NewBadge },
      edgeLeft: { component: StarBadge },
      edgeRight: { component: (props) => <BadgeComplication {...props} text="HOT" variant="warning" pulse /> },
      footer: { component: (props) => <BadgeComplication {...props} text="Featured" variant="info" size="md" /> },
    };

    return <ComplicationDemo complications={complications} title="Badge Complications Demo" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Showcases various badge complications including success, error, running, new, star, and custom badges with different variants and animations.',
      },
    },
  },
};

export const StatusComplications = {
  render: () => {
    const complications: ComplicationSlotsType = {
      topLeft: { component: OnlineStatus },
      topRight: { component: (props) => <StatusComplication {...props} status="pending" text="Processing" /> },
      bottomLeft: { component: OfflineStatus },
      bottomRight: { component: ErrorStatus },
      edgeLeft: { component: (props) => <StatusComplication {...props} status="success" dotOnly /> },
      edgeRight: { component: (props) => <StatusComplication {...props} status="warning" dotOnly /> },
      footer: { component: SuccessStatus },
    };

    return <ComplicationDemo complications={complications} title="Status Complications Demo" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows different status complications with colored dots and text, including online/offline, processing states, and dot-only variants for edge slots.',
      },
    },
  },
};

export const MetricComplications = {
  render: () => {
    const complications: ComplicationSlotsType = {
      topLeft: { component: (props) => <SuccessRateMetric {...props} value={94} /> },
      topRight: { component: (props) => <LatencyMetric {...props} value={1850} /> },
      bottomLeft: { component: (props) => <CostMetric {...props} value={0.028} /> },
      bottomRight: { component: (props) => <UsageMetric {...props} value={1247} /> },
      edgeRight: { component: (props) => <MetricComplication {...props} value={42} label="Runs" variant="info" /> },
      footer: { component: (props) => <MetricComplication {...props} value={99.5} unit="%" label="Uptime" variant="success" trend="up" /> },
    };

    return <ComplicationDemo complications={complications} title="Metric Complications Demo" cardSize="xl" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays various metric complications showing KPIs like success rate, latency, cost, usage, and uptime with different formatting and trend indicators.',
      },
    },
  },
};

export const SparklineComplications = {
  render: () => {
    const successData = [0.89, 0.91, 0.88, 0.94, 0.87, 0.92, 0.89];
    const latencyData = [2100, 1950, 1800, 1750, 1850, 1900, 1850];
    const costData = [0.008, 0.009, 0.012, 0.010, 0.011, 0.008, 0.012];

    const complications: ComplicationSlotsType = {
      topRight: { component: (props) => <SuccessRateSparkline {...props} data={successData} /> },
      bottomLeft: { component: (props) => <LatencySparkline {...props} data={latencyData} /> },
      bottomRight: { component: (props) => <CostSparkline {...props} data={costData} /> },
      edgeLeft: {
        component: (props) => <SparklineComplication {...props} data={[10, 25, 30, 28, 35, 42, 38]} variant="info" fill />,
      },
      footer: {
        component: (props) => <SparklineComplication {...props} data={successData} variant="success" label="7-day trend" width={100} fill />,
      },
    };

    return <ComplicationDemo complications={complications} title="Sparkline Complications Demo" cardSize="xl" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows sparkline complications displaying trend data as mini charts, including success rates, latency, cost, and custom metrics with fill options.',
      },
    },
  },
};

// ============================================================================
// STATE-RESPONSIVE DEMONSTRATIONS
// ============================================================================

export const CardStateResponsive = {
  render: () => {
    const complications: ComplicationSlotsType = {
      topLeft: {
        component: (props) => {
          const statusMap = {
            default: 'success' as const,
            running: 'pending' as const,
            error: 'error' as const,
            selected: 'success' as const,
            disabled: 'offline' as const,
          };
          return <StatusComplication {...props} status={statusMap[props.cardState]} />;
        }
      },
      topRight: {
        component: RunningBadge,
        supportedStates: ['running'],
      },
      bottomRight: {
        component: ErrorBadge,
        supportedStates: ['error'],
      },
      edgeRight: {
        component: (props) => <SparklineComplication {...props} data={[0.8, 0.9, 0.85, 0.92, 0.88, 0.94, 0.89]} variant="success" />,
        supportedStates: ['default', 'selected'],
      },
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px', padding: '40px' }}>
        <ComplicationDemo
          complications={complications}
          cardState="default"
          title="Default State"
        />
        <ComplicationDemo
          complications={complications}
          cardState="running"
          title="Running State"
        />
        <ComplicationDemo
          complications={complications}
          cardState="error"
          title="Error State"
        />
        <ComplicationDemo
          complications={complications}
          cardState="selected"
          title="Selected State"
        />
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Demonstrates how complications respond to different card states, with some complications showing only in specific states.',
      },
    },
  },
};

// ============================================================================
// ERROR HANDLING DEMONSTRATIONS
// ============================================================================

export const ErrorHandling = {
  render: () => {
    // Complication that throws an error
    const ErrorProneComplication = (props: ComplicationProps) => {
      if (props.cardId.includes('error')) {
        throw new Error('Simulated complication error');
      }
      return <BadgeComplication {...props} text="OK" variant="success" />;
    };

    const complications: ComplicationSlotsType = {
      topLeft: { component: ErrorProneComplication },
      topRight: { component: SuccessBadge },
      bottomRight: { component: (props) => <StatusComplication {...props} status="online" /> },
    };

    return (
      <div style={{ display: 'flex', gap: '40px', padding: '40px' }}>
        <div>
          <h4 style={{ marginBottom: '20px' }}>Normal Card</h4>
          <ComplicationDemo
            complications={complications}
            title="Normal Card"
          />
        </div>
        <div>
          <h4 style={{ marginBottom: '20px' }}>Card with Error</h4>
          <PromptCard
            title="error-card"
            version={1}
            access="private"
            tags={['error', 'demo']}
            bodyPreview="This card has a complication that throws an error."
            complications={complications}
            onRun={fn()}
            onEdit={fn()}
            onFork={fn()}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows error boundary behavior when complications fail to render. The error complication shows a fallback while other complications continue working.',
      },
    },
  },
};

// ============================================================================
// FEATURE FLAG DEMONSTRATIONS
// ============================================================================

export const FeatureFlags = {
  render: () => {
    const [animationsEnabled, setAnimationsEnabled] = useState(true);

    const complications: ComplicationSlotsType = {
      topLeft: {
        component: (props) => <BadgeComplication {...props} text="✓" variant="success" pulse />,
        requiresAnimations: true,
      },
      topRight: { component: RunningBadge },
      bottomRight: { component: (props) => <StatusComplication {...props} status="pending" pulse /> },
      edgeRight: {
        component: (props) => <SparklineComplication {...props} data={[0.8, 0.9, 0.85, 0.92]} variant="info" />,
      },
    };

    // Mock the media query for reduced motion
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleChange = () => setAnimationsEnabled(!mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return (
      <div style={{ padding: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={animationsEnabled}
              onChange={(e) => setAnimationsEnabled(e.target.checked)}
            />
            Enable animations (simulates prefers-reduced-motion)
          </label>
        </div>
        <ComplicationDemo complications={complications} title="Feature Flag Demo" />
        <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--mp-color-text-muted)' }}>
          The pulse badge (top-left) requires animations and will hide if animations are disabled.
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates feature flag behavior, including how complications that require animations respond to reduced motion preferences.',
      },
    },
  },
};

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

export const PerformanceTest = {
  render: () => {
    const complications: ComplicationSlotsType = {
      topLeft: {
        component: SuccessBadge,
        performance: { memoize: true, priority: 100 },
      },
      topRight: {
        component: (props) => <StatusComplication {...props} status="online" />,
        performance: { memoize: true, priority: 90 },
      },
      bottomLeft: {
        component: (props) => <MetricComplication {...props} value={Math.random() * 100} unit="%" />,
        performance: { memoize: true, priority: 80 },
      },
      bottomRight: {
        component: (props) => <SparklineComplication {...props} data={Array.from({ length: 7 }, () => Math.random())} />,
        performance: { memoize: true, priority: 70 },
      },
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '40px' }}>
        {Array.from({ length: 9 }, (_, i) => (
          <ComplicationDemo
            key={i}
            complications={complications}
            title={`Performance Card ${i + 1}`}
          />
        ))}
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Performance test with multiple cards containing memoized complications. Tests rendering efficiency and priority ordering.',
      },
    },
  },
};

// ============================================================================
// INTERACTIVE PLAYGROUND
// ============================================================================

export const InteractivePlayground = {
  render: () => {
    const [selectedSlot, setSelectedSlot] = useState<SlotPosition>('topRight');
    const [complicationType, setComplicationType] = useState<'badge' | 'status' | 'metric' | 'sparkline'>('badge');
    const [cardSize, setCardSize] = useState<CardSize>('standard');
    const [cardState, setCardState] = useState<CardState>('default');

    // Build complications based on selections
    const getComplicationComponent = () => {
      switch (complicationType) {
        case 'badge':
          return (props: any) => <BadgeComplication {...props} text="TEST" variant="info" />;
        case 'status':
          return (props: any) => <StatusComplication {...props} status="online" />;
        case 'metric':
          return (props: any) => <MetricComplication {...props} value={42} unit="%" />;
        case 'sparkline':
          return (props: any) => <SparklineComplication {...props} data={[0.8, 0.9, 0.85, 0.92]} variant="success" />;
      }
    };

    const complications: ComplicationSlotsType = {
      [selectedSlot]: {
        component: getComplicationComponent(),
      },
    };

    const slotOptions: SlotPosition[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'edgeLeft', 'edgeRight', 'footer'];
    const typeOptions = ['badge', 'status', 'metric', 'sparkline'] as const;
    const sizeOptions: CardSize[] = ['compact', 'standard', 'xl'];
    const stateOptions: CardState[] = ['default', 'running', 'error', 'selected', 'disabled'];

    return (
      <div style={{ padding: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Slot Position:</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value as SlotPosition)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--mp-color-border)' }}
            >
              {slotOptions.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Complication Type:</label>
            <select
              value={complicationType}
              onChange={(e) => setComplicationType(e.target.value as any)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--mp-color-border)' }}
            >
              {typeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Card Size:</label>
            <select
              value={cardSize}
              onChange={(e) => setCardSize(e.target.value as CardSize)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--mp-color-border)' }}
            >
              {sizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Card State:</label>
            <select
              value={cardState}
              onChange={(e) => setCardState(e.target.value as CardState)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--mp-color-border)' }}
            >
              {stateOptions.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>

        <ComplicationDemo
          complications={complications}
          cardSize={cardSize}
          cardState={cardState}
          title="Interactive Playground"
          debug={true}
        />
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Interactive playground for testing different complication types in various slot positions with different card sizes and states.',
      },
    },
  },
};
