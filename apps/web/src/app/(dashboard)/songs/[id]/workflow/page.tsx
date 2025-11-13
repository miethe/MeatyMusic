/**
 * Song Workflow Page
 * Display workflow graph and real-time status
 */

'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkflowGraph } from '@/components/workflow/WorkflowGraph';
import { WorkflowStatus } from '@/components/workflow/WorkflowStatus';
import { Card } from '@meatymusic/ui';
import { WorkflowNode } from '@/types/api';

export default function SongWorkflowPage() {
  const params = useParams();
  const songId = params.id as string;

  // TODO: Fetch workflow data and connect to WebSocket
  const nodes = [
    { id: WorkflowNode.PLAN, status: 'success' as const, durationMs: 1200 },
    { id: WorkflowNode.STYLE, status: 'success' as const, durationMs: 2300 },
    { id: WorkflowNode.LYRICS, status: 'running' as const },
    { id: WorkflowNode.PRODUCER, status: 'pending' as const },
    { id: WorkflowNode.COMPOSE, status: 'pending' as const },
    { id: WorkflowNode.VALIDATE, status: 'pending' as const },
    { id: WorkflowNode.FIX, status: 'pending' as const },
    { id: WorkflowNode.RENDER, status: 'pending' as const },
    { id: WorkflowNode.REVIEW, status: 'pending' as const },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Workflow"
        description="Real-time workflow execution status"
        breadcrumbs={[
          { label: 'Songs', href: '/songs' },
          { label: 'Song Name', href: `/songs/${songId}` },
          { label: 'Workflow' },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Workflow Status Summary */}
        <div className="mb-8">
          <WorkflowStatus
            status="running"
            currentNode="LYRICS"
            progress={33}
            startedAt={new Date(Date.now() - 60000)}
          />
        </div>

        {/* Workflow Graph */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Workflow Progress</h2>
          <WorkflowGraph
            nodes={nodes}
            orientation="horizontal"
            showMetrics
            onNodeClick={(node) => console.log('Node clicked:', node)}
          />
        </Card>

        {/* Node Details */}
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Current Node</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Node</div>
                <div className="font-semibold">LYRICS</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-semibold text-yellow-500">Running</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Started</div>
                <div className="font-semibold">30 seconds ago</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Workflow Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed Nodes</span>
                <span className="font-semibold">2 / 9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Duration</span>
                <span className="font-semibold">1 minute</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fix Attempts</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
