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
import { Badge } from '@meatymusic/ui';
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
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Songs</h2>
                <Link href={ROUTES.SONGS}>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="text-center py-12">
                <Music2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No songs yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first song to get started with MeatyMusic AMCS
                </p>
                <Link href={ROUTES.SONG_NEW}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Song
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link href={ROUTES.SONG_NEW} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    New Song
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.STYLES} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Browse Styles
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.LYRICS} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Browse Lyrics
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.PERSONAS} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Browse Personas
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.BLUEPRINTS} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    View Blueprints
                  </Button>
                </Link>
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">System Status</h2>
              <div className="space-y-3">
                <StatusItem label="API" status="operational" />
                <StatusItem label="Workflow Engine" status="operational" />
                <StatusItem label="Database" status="operational" />
              </div>
            </Card>
          </div>
        </div>

        {/* Getting Started */}
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="text-primary">{icon}</div>
      </div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="flex items-center gap-2">
        {trendDirection === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
        <span className="text-sm text-muted-foreground">{trend}</span>
      </div>
    </Card>
  );
}

function StatusItem({ label, status }: { label: string; status: 'operational' | 'degraded' | 'down' }) {
  const statusConfig = {
    operational: { color: 'bg-green-500', text: 'Operational' },
    degraded: { color: 'bg-yellow-500', text: 'Degraded' },
    down: { color: 'bg-red-500', text: 'Down' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <span className="text-sm text-muted-foreground">{config.text}</span>
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
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
