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
import { WorkflowGraph, type WorkflowNodeState } from '@/components/workflow/WorkflowGraph';
import { MetricsPanel } from '@/components/workflow/MetricsPanel';
import { ArtifactPreview, type ArtifactData } from '@/components/workflow/ArtifactPreview';
import { WorkflowNode, WorkflowRunStatus, type Song, type WorkflowSummary } from '@/types/api';

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
  status: 'rendered',
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

  // Placeholder state (will be replaced with API calls in Wave 3)
  const [song] = React.useState<Song>(MOCK_SONG);
  const [workflowNodes] = React.useState<WorkflowNodeState[]>(MOCK_WORKFLOW_NODES);
  const [summary] = React.useState<WorkflowSummary>(MOCK_SUMMARY);
  const [artifacts] = React.useState<ArtifactData>(MOCK_ARTIFACTS);

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
        {/* Header */}
        <WorkflowHeader
          song={song}
          status={summary.status as WorkflowRunStatus}
          runId={summary.run_id}
          onDownloadArtifacts={handleDownloadArtifacts}
          onRetryWorkflow={handleRetryWorkflow}
        />

        {/* Workflow Graph */}
        <WorkflowGraph
          nodes={workflowNodes}
          orientation="horizontal"
          showMetrics
          onNodeClick={handleNodeClick}
        />

        {/* Metrics and Artifacts - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics Panel - 1/3 width on desktop */}
          <div className="lg:col-span-1">
            <MetricsPanel summary={summary} />
          </div>

          {/* Artifact Preview Panel - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <ArtifactPreview artifacts={artifacts} defaultTab="lyrics" />
          </div>
        </div>
      </div>
    </div>
  );
}
