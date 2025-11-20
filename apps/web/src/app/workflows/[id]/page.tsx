/**
 * Workflow Dashboard Page
 * Next.js App Router page for /workflows/[id]
 *
 * Displays:
 * - Workflow header with song info and status
 * - Workflow graph visualization
 * - Metrics panel with validation scores
 * - Artifact preview panel
 *
 * Real-time updates via WebSocket (Wave 3)
 */

'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { WorkflowHeader } from '@/components/workflow/WorkflowHeader';
import type { WorkflowNodeState } from '@/components/workflow/WorkflowGraph';
import { ArtifactPreview, type ArtifactData } from '@/components/workflow/ArtifactPreview';
import { WorkflowProgress } from '@/components/workflow-progress';
import { WorkflowDAG } from '@/components/workflow-dag';
import { WorkflowMetrics } from '@/components/workflow-metrics';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { useWorkflowStore } from '@/stores/workflowStore';
import { WorkflowNode, WorkflowRunStatus, SongStatus, type Song, type WorkflowSummary } from '@/types/api';

/**
 * Mock data for development (Wave 2B)
 * Will be replaced with API calls and WebSocket in Wave 3
 */
const MOCK_SONG: Song = {
  id: 'song-123',
  tenant_id: 'tenant-1',
  owner_id: 'user-1',
  title: 'Holiday Hustle',
  sds_version: '1.0',
  global_seed: 42,
  style_id: 'style-abc',
  persona_id: 'persona-xyz',
  blueprint_id: 'blueprint-pop',
  status: SongStatus.RENDERED,
  created_at: '2025-11-13T10:00:00Z',
  updated_at: '2025-11-13T10:05:00Z',
  extra_metadata: {},
};

const MOCK_WORKFLOW_NODES: WorkflowNodeState[] = [
  { id: WorkflowNode.PLAN, status: 'success', durationMs: 2100 },
  { id: WorkflowNode.STYLE, status: 'success', durationMs: 8700 },
  { id: WorkflowNode.LYRICS, status: 'success', durationMs: 18400 },
  { id: WorkflowNode.PRODUCER, status: 'success', durationMs: 5900 },
  { id: WorkflowNode.COMPOSE, status: 'success', durationMs: 7200 },
  { id: WorkflowNode.VALIDATE, status: 'success', durationMs: 3000 },
  { id: WorkflowNode.FIX, status: 'skipped' },
  { id: WorkflowNode.RENDER, status: 'pending' },
  { id: WorkflowNode.REVIEW, status: 'pending' },
];

const MOCK_SUMMARY: WorkflowSummary = {
  run_id: 'run-456',
  song_id: 'song-123',
  status: WorkflowRunStatus.RUNNING,
  started_at: '2025-11-13T10:00:00Z',
  duration_ms: 45300,
  nodes_executed: [
    { node: WorkflowNode.PLAN, status: 'success', duration_ms: 2100, output: {} },
    { node: WorkflowNode.STYLE, status: 'success', duration_ms: 8700, output: {} },
    { node: WorkflowNode.LYRICS, status: 'success', duration_ms: 18400, output: {} },
    { node: WorkflowNode.PRODUCER, status: 'success', duration_ms: 5900, output: {} },
    { node: WorkflowNode.COMPOSE, status: 'success', duration_ms: 7200, output: {} },
    { node: WorkflowNode.VALIDATE, status: 'success', duration_ms: 3000, output: {} },
  ],
  validation_scores: {
    hook_density: 8.5,
    singability: 9.0,
    rhyme_tightness: 7.8,
    section_completeness: 10.0,
    profanity_score: 10.0,
    total: 9.06,
    passed: true,
  },
  fix_iterations: [],
};

const MOCK_ARTIFACTS: ArtifactData = {
  lyrics: {
    sections: [
      {
        type: 'Verse 1',
        lines: [
          'Running through the winter chill',
          'Looking for that perfect thrill',
          'Shopping bags and twinkling lights',
          'City streets on Christmas nights',
        ],
      },
      {
        type: 'Chorus',
        lines: [
          "It's the holiday hustle, feeling so right",
          'Got my list and checking it twice tonight',
          'Every corner glowing bright',
          "It's the holiday hustle, pure delight",
        ],
      },
      {
        type: 'Verse 2',
        lines: [
          'Coffee shops and carolers sing',
          'Everybody gathering',
          'Spreading joy from place to place',
          'Smiles on every face',
        ],
      },
      {
        type: 'Chorus',
        lines: [
          "It's the holiday hustle, feeling so right",
          'Got my list and checking it twice tonight',
          'Every corner glowing bright',
          "It's the holiday hustle, pure delight",
        ],
      },
    ],
  },
  style: {
    genre: 'Pop',
    subGenres: ['Christmas'],
    tempo: { min: 116, max: 124 },
    key: 'C Major',
    mood: ['upbeat', 'cheeky', 'warm'],
    instrumentation: ['bells', 'piano', 'drums'],
    tags: ['modern-bright', 'four-on-the-floor', '2020s'],
  },
  producerNotes: {
    structure: 'Intro → Verse → Chorus → Verse → Chorus → Bridge → Chorus → Outro',
    hooks: 3,
    mix: {
      lufs: -9,
      space: 'modern-bright',
      stereoWidth: 'wide',
    },
  },
  composedPrompt: `Title: Holiday Hustle
Genre: Pop, Christmas
Tempo: 116-124 BPM, C Major
Mood: upbeat, cheeky, warm
Instrumentation: bells, piano, drums
Tags: modern-bright, four-on-the-floor, 2020s

Structure: Intro → Verse → Chorus → Verse → Chorus → Bridge → Chorus → Outro

[Verse 1]
Running through the winter chill
Looking for that perfect thrill
Shopping bags and twinkling lights
City streets on Christmas nights

[Chorus]
It's the holiday hustle, feeling so right
Got my list and checking it twice tonight
Every corner glowing bright
It's the holiday hustle, pure delight`,
};

/**
 * Workflow Dashboard Page Component
 */
export default function WorkflowDashboardPage() {
  const params = useParams();
  const workflowId = params.id as string;

  // WebSocket connection for real-time updates (P1.3)
  const { isLoading: wsLoading, error: wsError } = useWorkflowEvents(workflowId, {
    enabled: true,
    enableNotifications: true,
    onEvent: (event) => {
      console.log('Workflow event received:', event);
    },
  });

  // Get workflow state from store (updated via WebSocket)
  const workflowRun = useWorkflowStore((state) => state.activeRuns.get(workflowId));
  const isConnected = useWorkflowStore((state) => state.isConnected);

  // Placeholder state (will be replaced with API calls in Wave 3)
  // For now, use mock data if WebSocket data is not available
  const [song] = React.useState<Song>(MOCK_SONG);
  const [summary] = React.useState<WorkflowSummary>(MOCK_SUMMARY);
  const [artifacts] = React.useState<ArtifactData>(MOCK_ARTIFACTS);

  // Use WebSocket data if available, otherwise fall back to mock
  const workflowNodes: WorkflowNodeState[] = React.useMemo(() => {
    if (workflowRun?.nodes) {
      return Object.entries(workflowRun.nodes).map(([nodeId, nodeState]) => ({
        id: nodeId as WorkflowNode,
        status: nodeState.status,
        startedAt: nodeState.startedAt,
        completedAt: nodeState.completedAt,
        durationMs: nodeState.durationMs,
        error: nodeState.error,
      }));
    }
    return MOCK_WORKFLOW_NODES;
  }, [workflowRun]);

  // Update summary with WebSocket data if available
  const effectiveSummary: WorkflowSummary = React.useMemo(() => {
    if (workflowRun) {
      return {
        ...summary,
        status: workflowRun.status || summary.status,
        nodes_executed: workflowNodes
          .filter(n => n.status !== 'pending')
          .map(n => ({
            node: n.id,
            status: n.status === 'success' ? 'success' : n.status === 'failed' ? 'failed' : 'skipped',
            duration_ms: n.durationMs || 0,
            output: {},
          })),
      };
    }
    return summary;
  }, [workflowRun, summary, workflowNodes]);

  // Placeholder callbacks (will be wired to API in Wave 3)
  const handleDownloadArtifacts = () => {
    // Download all artifacts as JSON
    const blob = new Blob([JSON.stringify(artifacts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${workflowId}-artifacts.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRetryWorkflow = () => {
    // Retry workflow (will call API in Wave 3)
    console.log('Retry workflow:', workflowId);
    alert('Retry workflow functionality will be implemented in Wave 3');
  };

  const handleNodeClick = (node: WorkflowNodeState) => {
    // Show node details (will open modal or panel in Wave 3)
    console.log('Node clicked:', node);
  };

  return (
    <div className="min-h-screen bg-background-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* WebSocket Connection Status */}
        {!isConnected && !wsLoading && (
          <div className="p-4 bg-accent-warning/10 border border-accent-warning rounded-lg">
            <p className="text-sm text-accent-warning">
              ⚠ WebSocket disconnected. Reconnecting...
            </p>
          </div>
        )}

        {wsError && (
          <div className="p-4 bg-accent-error/10 border border-accent-error rounded-lg">
            <p className="text-sm text-accent-error">
              ✗ WebSocket error: {wsError.message}
            </p>
          </div>
        )}

        {/* Header */}
        <WorkflowHeader
          song={song}
          status={effectiveSummary.status as WorkflowRunStatus}
          runId={effectiveSummary.run_id}
          onDownloadArtifacts={handleDownloadArtifacts}
          onRetryWorkflow={handleRetryWorkflow}
        />

        {/* Progress Bar - NEW P1.3 Component */}
        <div className="p-6 bg-background-secondary rounded-xl border border-border/10">
          <WorkflowProgress
            status={effectiveSummary.status as WorkflowRunStatus}
            currentNode={workflowNodes.find(n => n.status === 'running')?.id}
            completedNodes={workflowNodes.filter(n => n.status === 'success').length}
            totalNodes={9}
            estimatedCompletion={
              effectiveSummary.status === WorkflowRunStatus.RUNNING
                ? new Date(Date.now() + 30000) // Mock: 30s remaining
                : undefined
            }
          />
        </div>

        {/* Workflow DAG - NEW P1.3 Component */}
        <div className="p-6 bg-background-secondary rounded-xl border border-border/10">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Workflow DAG</h3>
          <WorkflowDAG
            nodes={workflowNodes}
            orientation="horizontal"
            showMetrics
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Legacy Workflow Graph (can be removed if DAG is preferred) */}
        {/* <WorkflowGraph
          nodes={workflowNodes}
          orientation="horizontal"
          showMetrics
          onNodeClick={handleNodeClick}
        /> */}

        {/* Metrics and Artifacts - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics Cards - NEW P1.3 Component - 1/3 width on desktop */}
          <div className="lg:col-span-1">
            <WorkflowMetrics
              scores={effectiveSummary.validation_scores}
              detailed
            />
          </div>

          {/* Artifact Preview Panel - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <ArtifactPreview artifacts={artifacts} defaultTab="lyrics" />
          </div>
        </div>

        {/* Legacy Metrics Panel (can be removed if new metrics component is preferred) */}
        {/* <div className="lg:col-span-1">
          <MetricsPanel summary={summary} />
        </div> */}
      </div>
    </div>
  );
}
