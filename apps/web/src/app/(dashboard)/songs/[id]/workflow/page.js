/**
 * Song Workflow Page
 * Display workflow graph and real-time status
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SongWorkflowPage;
var React = require("react");
var navigation_1 = require("next/navigation");
var PageHeader_1 = require("@/components/layout/PageHeader");
var WorkflowGraph_1 = require("@/components/workflow/WorkflowGraph");
var WorkflowStatus_1 = require("@/components/workflow/WorkflowStatus");
var ui_1 = require("@meatymusic/ui");
var api_1 = require("@/types/api");
function SongWorkflowPage() {
    var params = (0, navigation_1.useParams)();
    var songId = params.id;
    // TODO: Fetch workflow data and connect to WebSocket
    var nodes = [
        { id: api_1.WorkflowNode.PLAN, status: 'success', durationMs: 1200 },
        { id: api_1.WorkflowNode.STYLE, status: 'success', durationMs: 2300 },
        { id: api_1.WorkflowNode.LYRICS, status: 'running' },
        { id: api_1.WorkflowNode.PRODUCER, status: 'pending' },
        { id: api_1.WorkflowNode.COMPOSE, status: 'pending' },
        { id: api_1.WorkflowNode.VALIDATE, status: 'pending' },
        { id: api_1.WorkflowNode.FIX, status: 'pending' },
        { id: api_1.WorkflowNode.RENDER, status: 'pending' },
        { id: api_1.WorkflowNode.REVIEW, status: 'pending' },
    ];
    return (<div className="min-h-screen">
      <PageHeader_1.PageHeader title="Workflow" description="Real-time workflow execution status" breadcrumbs={[
            { label: 'Songs', href: '/songs' },
            { label: 'Song Name', href: "/songs/".concat(songId) },
            { label: 'Workflow' },
        ]}/>

      <div className="container mx-auto px-4 py-8">
        {/* Workflow Status Summary */}
        <div className="mb-8">
          <WorkflowStatus_1.WorkflowStatus status="running" currentNode="LYRICS" progress={33} durationMs={60000}/>
        </div>

        {/* Workflow Graph */}
        <ui_1.Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Workflow Progress</h2>
          <WorkflowGraph_1.WorkflowGraph nodes={nodes} orientation="horizontal" showMetrics onNodeClick={function (node) { return console.log('Node clicked:', node); }}/>
        </ui_1.Card>

        {/* Node Details */}
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <ui_1.Card className="p-6">
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
          </ui_1.Card>

          <ui_1.Card className="p-6">
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
          </ui_1.Card>
        </div>
      </div>
    </div>);
}
