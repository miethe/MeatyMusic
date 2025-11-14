/**
 * Dashboard Page
 * Overview metrics, recent activity, and quick actions
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import {
  Music2,
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Dashboard"
        description="Welcome to MeatyMusic AMCS - Your music creation workspace"
        actions={
          <Link href={ROUTES.SONG_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Song
            </Button>
          </Link>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Songs"
            value="0"
            icon={<Music2 className="w-5 h-5" />}
            trend="+0 this week"
            trendDirection="neutral"
          />
          <MetricCard
            title="In Progress"
            value="0"
            icon={<Clock className="w-5 h-5" />}
            trend="0 active workflows"
            trendDirection="neutral"
          />
          <MetricCard
            title="Completed"
            value="0"
            icon={<CheckCircle2 className="w-5 h-5" />}
            trend="0% success rate"
            trendDirection="neutral"
          />
          <MetricCard
            title="Failed"
            value="0"
            icon={<AlertCircle className="w-5 h-5" />}
            trend="0 need attention"
            trendDirection="neutral"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Songs */}
          <div className="lg:col-span-2 animate-slide-up">
            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Recent Songs</h2>
                <Link href={ROUTES.SONGS}>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-bg-elevated flex items-center justify-center">
                  <Music2 className="w-10 h-10 text-text-muted" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">No songs yet</h3>
                <p className="text-text-secondary mb-6">
                  Create your first song to get started with MeatyMusic AMCS
                </p>
                <Link href={ROUTES.SONG_NEW}>
                  <Button className="bg-gradient-primary text-white shadow-accent-glow hover:shadow-accent-glow-lg hover:scale-105 transition-all duration-ui">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Song
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6 animate-slide-up animation-delay-100">
            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <h2 className="text-xl font-semibold text-text-primary mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link href={ROUTES.SONG_NEW} className="block">
                  <Button variant="outline" className="w-full justify-start bg-bg-elevated hover:bg-bg-overlay border-border-default hover:border-border-accent text-text-primary transition-all duration-ui">
                    <Plus className="w-4 h-4 mr-2" />
                    New Song
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.STYLES} className="block">
                  <Button variant="outline" className="w-full justify-start bg-bg-elevated hover:bg-bg-overlay border-border-default hover:border-border-accent text-text-primary transition-all duration-ui">
                    Browse Styles
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.LYRICS} className="block">
                  <Button variant="outline" className="w-full justify-start bg-bg-elevated hover:bg-bg-overlay border-border-default hover:border-border-accent text-text-primary transition-all duration-ui">
                    Browse Lyrics
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.PERSONAS} className="block">
                  <Button variant="outline" className="w-full justify-start bg-bg-elevated hover:bg-bg-overlay border-border-default hover:border-border-accent text-text-primary transition-all duration-ui">
                    Browse Personas
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.BLUEPRINTS} className="block">
                  <Button variant="outline" className="w-full justify-start bg-bg-elevated hover:bg-bg-overlay border-border-default hover:border-border-accent text-text-primary transition-all duration-ui">
                    View Blueprints
                  </Button>
                </Link>
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <h2 className="text-xl font-semibold text-text-primary mb-4">System Status</h2>
              <div className="space-y-3">
                <StatusItem label="API" status="operational" />
                <StatusItem label="Workflow Engine" status="operational" />
                <StatusItem label="Database" status="operational" />
              </div>
            </Card>
          </div>
        </div>

        {/* Getting Started */}
        <Card className="p-6 mt-8 bg-bg-surface border-border-default shadow-elevation-1 animate-fade-in animation-delay-200">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Getting Started</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard
              number={1}
              title="Create a Song"
              description="Start with basic song information and select your creative direction"
            />
            <StepCard
              number={2}
              title="Design Entities"
              description="Define style, lyrics, persona, and producer notes for your song"
            />
            <StepCard
              number={3}
              title="Run Workflow"
              description="Execute the AMCS workflow to generate validated musical artifacts"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  trendDirection,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-ui animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-secondary">{title}</span>
        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
          <div className="text-white">{icon}</div>
        </div>
      </div>
      <div className="text-3xl font-bold text-text-primary mb-2">{value}</div>
      <div className="flex items-center gap-2">
        {trendDirection === 'up' && <TrendingUp className="w-4 h-4 text-success-500" />}
        <span className="text-sm text-text-secondary">{trend}</span>
      </div>
    </Card>
  );
}

function StatusItem({ label, status }: { label: string; status: 'operational' | 'degraded' | 'down' }) {
  const statusConfig = {
    operational: { color: 'bg-success-500', text: 'Operational', textColor: 'text-success-300' },
    degraded: { color: 'bg-warning-500', text: 'Degraded', textColor: 'text-warning-300' },
    down: { color: 'bg-error-500', text: 'Down', textColor: 'text-error-300' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-primary">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <span className={`text-sm ${config.textColor}`}>{config.text}</span>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-700/20 text-primary-300 flex items-center justify-center font-semibold text-lg">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
