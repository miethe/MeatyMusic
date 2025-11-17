/**
 * Dashboard Page
 * Overview metrics, recent activity, and quick actions with real API data
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, Skeleton, LoadingErrorFallback } from '@meatymusic/ui';
import {
  Music2,
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  FileText,
  User,
  Settings,
  ListMusic,
  Map
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { ImportModal } from '@/components/import/ImportModal';
import { useSongs } from '@/hooks/api/useSongs';
import { useWorkflowRuns } from '@/hooks/api/useWorkflows';
import { useStyles } from '@/hooks/api/useStyles';
import { useLyricsList } from '@/hooks/api/useLyrics';
import { usePersonas } from '@/hooks/api/usePersonas';
import { useProducerNotesList } from '@/hooks/api/useProducerNotes';
import { useBlueprints } from '@/hooks/api/useBlueprints';
import { formatDistanceToNow } from 'date-fns';
import type { Song, WorkflowRun, WorkflowRunStatus } from '@/types/api';

export default function DashboardPage() {
  const [importModalOpen, setImportModalOpen] = React.useState(false);

  // Fetch all data
  const {
    data: songsData,
    isLoading: songsLoading,
    error: songsError,
    refetch: refetchSongs
  } = useSongs({ limit: 5, sort: 'created_at:desc' });

  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    refetch: refetchWorkflows
  } = useWorkflowRuns({ limit: 10, sort: 'created_at:desc' });

  // Entity counts for stats
  const { data: stylesData } = useStyles();
  const { data: lyricsData } = useLyricsList();
  const { data: personasData } = usePersonas();
  const { data: producerNotesData } = useProducerNotesList();
  const { data: blueprintsData } = useBlueprints();

  // Compute metrics from workflow data
  const inProgress = workflowsData?.items.filter(w => w.status === 'running').length || 0;
  const completed = workflowsData?.items.filter(w => w.status === 'completed').length || 0;
  const failed = workflowsData?.items.filter(w => w.status === 'failed').length || 0;
  const totalSongs = songsData?.page_info?.total_count || 0;

  // Show error state if critical data fails
  if (songsError) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Dashboard"
          description="Welcome to MeatyMusic AMCS - Your music creation workspace"
        />
        <div className="container mx-auto px-4 py-8">
          <LoadingErrorFallback
            error={songsError as Error}
            retry={() => {
              refetchSongs();
              refetchWorkflows();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Dashboard"
        description="Welcome to MeatyMusic AMCS - Your music creation workspace"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Link href={ROUTES.SONG_NEW}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Song
              </Button>
            </Link>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {songsLoading || workflowsLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Songs"
                value={totalSongs.toString()}
                icon={<Music2 className="w-5 h-5" />}
                trend={`${totalSongs > 0 ? 'Active' : 'Get started'}`}
                trendDirection="neutral"
              />
              <MetricCard
                title="In Progress"
                value={inProgress.toString()}
                icon={<Clock className="w-5 h-5" />}
                trend={`${inProgress} active workflows`}
                trendDirection={inProgress > 0 ? 'up' : 'neutral'}
              />
              <MetricCard
                title="Completed"
                value={completed.toString()}
                icon={<CheckCircle2 className="w-5 h-5" />}
                trend={completed > 0 ? `${Math.round((completed / Math.max(completed + failed, 1)) * 100)}% success rate` : 'No completions yet'}
                trendDirection={completed > 0 ? 'up' : 'neutral'}
              />
              <MetricCard
                title="Failed"
                value={failed.toString()}
                icon={<AlertCircle className="w-5 h-5" />}
                trend={failed > 0 ? `${failed} need attention` : 'All good'}
                trendDirection={failed > 0 ? 'down' : 'neutral'}
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Songs */}
          <div className="lg:col-span-2 animate-slide-up">
            <Card className="p-8 bg-surface border-border shadow-elev1">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold text-text-strong">Recent Songs</h2>
                <Link href={ROUTES.SONGS}>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {songsLoading ? (
                <div className="space-y-4">
                  <SongItemSkeleton />
                  <SongItemSkeleton />
                  <SongItemSkeleton />
                </div>
              ) : songsData?.items && songsData.items.length > 0 ? (
                <div className="space-y-3">
                  {songsData.items.map((song) => (
                    <SongListItem key={song.id} song={song} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-panel flex items-center justify-center">
                    <Music2 className="w-10 h-10 text-text-muted" />
                  </div>
                  <h3 className="text-lg font-medium text-text-strong mb-3">No songs yet</h3>
                  <p className="text-text-muted mb-8 max-w-md mx-auto">
                    Create your first song to get started with MeatyMusic AMCS
                  </p>
                  <Link href={ROUTES.SONG_NEW}>
                    <Button className="bg-primary text-primaryForeground hover:opacity-90 transition-all duration-ui px-6 py-3">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Song
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-slide-up animation-delay-100">
            {/* Recent Activity */}
            <Card className="p-8 bg-surface border-border shadow-elev1">
              <h2 className="text-xl font-semibold text-text-strong mb-6">Recent Activity</h2>
              {workflowsLoading ? (
                <div className="space-y-3">
                  <ActivityItemSkeleton />
                  <ActivityItemSkeleton />
                  <ActivityItemSkeleton />
                </div>
              ) : workflowsData?.items && workflowsData.items.length > 0 ? (
                <div className="space-y-3">
                  {workflowsData.items.slice(0, 5).map((workflow) => (
                    <ActivityItem key={workflow.run_id} workflow={workflow} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center py-8">
                  No workflow activity yet
                </p>
              )}
            </Card>

            {/* Entity Stats */}
            <Card className="p-8 bg-surface border-border shadow-elev1">
              <h2 className="text-xl font-semibold text-text-strong mb-6">Library Stats</h2>
              <div className="space-y-4">
                <EntityStatItem
                  label="Styles"
                  count={stylesData?.page_info?.total_count || 0}
                  icon={<Settings className="w-4 h-4" />}
                  href={ROUTES.ENTITIES.STYLES}
                />
                <EntityStatItem
                  label="Lyrics"
                  count={lyricsData?.page_info?.total_count || 0}
                  icon={<FileText className="w-4 h-4" />}
                  href={ROUTES.ENTITIES.LYRICS}
                />
                <EntityStatItem
                  label="Personas"
                  count={personasData?.page_info?.total_count || 0}
                  icon={<User className="w-4 h-4" />}
                  href={ROUTES.ENTITIES.PERSONAS}
                />
                <EntityStatItem
                  label="Producer Notes"
                  count={producerNotesData?.page_info?.total_count || 0}
                  icon={<ListMusic className="w-4 h-4" />}
                  href={ROUTES.ENTITIES.PRODUCER_NOTES}
                />
                <EntityStatItem
                  label="Blueprints"
                  count={blueprintsData?.page_info?.total_count || 0}
                  icon={<Map className="w-4 h-4" />}
                  href={ROUTES.ENTITIES.BLUEPRINTS}
                />
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-8 bg-surface border-border shadow-elev1">
              <h2 className="text-xl font-semibold text-text-strong mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link href={ROUTES.SONG_NEW} className="block">
                  <Button variant="outline" className="w-full justify-start px-4 py-3 bg-panel hover:bg-primary/10 border-border hover:border-primary text-text-base transition-all duration-ui">
                    <Plus className="w-4 h-4 mr-3" />
                    New Song
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.STYLES} className="block">
                  <Button variant="outline" className="w-full justify-start px-4 py-3 bg-panel hover:bg-primary/10 border-border hover:border-primary text-text-base transition-all duration-ui">
                    Browse Styles
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.LYRICS} className="block">
                  <Button variant="outline" className="w-full justify-start px-4 py-3 bg-panel hover:bg-primary/10 border-border hover:border-primary text-text-base transition-all duration-ui">
                    Browse Lyrics
                  </Button>
                </Link>
                <Link href={ROUTES.ENTITIES.PERSONAS} className="block">
                  <Button variant="outline" className="w-full justify-start px-4 py-3 bg-panel hover:bg-primary/10 border-border hover:border-primary text-text-base transition-all duration-ui">
                    Browse Personas
                  </Button>
                </Link>
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-8 bg-surface border-border shadow-elev1">
              <h2 className="text-xl font-semibold text-text-strong mb-6">System Status</h2>
              <div className="space-y-4">
                <StatusItem label="API" status="operational" />
                <StatusItem label="Workflow Engine" status="operational" />
                <StatusItem label="Database" status="operational" />
              </div>
            </Card>
          </div>
        </div>

        {/* Getting Started */}
        <Card className="p-8 mt-8 bg-surface border-border shadow-elev1 animate-fade-in animation-delay-200">
          <h2 className="text-xl font-semibold text-text-strong mb-6">Getting Started</h2>
          <div className="grid md:grid-cols-3 gap-8">
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

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportSuccess={() => {
          setImportModalOpen(false);
        }}
      />
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
    <Card className="p-8 bg-surface border-border shadow-elev1 hover:shadow-elev2 transition-all duration-ui animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-text-base">{title}</span>
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-md">
          <div className="text-primaryForeground">{icon}</div>
        </div>
      </div>
      <div className="text-3xl font-bold text-text-strong mb-3">{value}</div>
      <div className="flex items-center gap-2">
        {trendDirection === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
        {trendDirection === 'down' && <AlertCircle className="w-4 h-4 text-danger" />}
        <span className="text-sm text-text-muted">{trend}</span>
      </div>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="p-8 bg-surface border-border shadow-elev1">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-16 mb-3" />
      <Skeleton className="h-4 w-32" />
    </Card>
  );
}

function SongListItem({ song }: { song: Song }) {
  const statusColors = {
    draft: 'text-text-muted bg-panel',
    validated: 'text-info bg-info/10',
    rendering: 'text-warning bg-warning/10',
    rendered: 'text-success bg-success/10',
    failed: 'text-danger bg-danger/10',
  };

  const statusColor = statusColors[song.status || 'draft'];

  return (
    <Link href={ROUTES.SONG_DETAIL(song.id)}>
      <div className="flex items-center justify-between p-4 rounded-lg hover:bg-panel transition-colors cursor-pointer group">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Music2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-text-strong truncate group-hover:text-primary transition-colors">
              {song.title}
            </h3>
            <p className="text-sm text-text-muted">
              {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {song.status || 'draft'}
        </div>
      </div>
    </Link>
  );
}

function SongItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

function ActivityItem({ workflow }: { workflow: WorkflowRun }) {
  const statusConfig: Record<WorkflowRunStatus, { color: string; icon: React.ReactNode; label: string }> = {
    running: {
      color: 'text-info bg-info/10',
      icon: <Clock className="w-3 h-3" />,
      label: 'Running'
    },
    completed: {
      color: 'text-success bg-success/10',
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'Completed'
    },
    failed: {
      color: 'text-danger bg-danger/10',
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Failed'
    },
    cancelled: {
      color: 'text-text-muted bg-panel',
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Cancelled'
    },
  };

  const status = statusConfig[workflow.status || 'running'];

  return (
    <Link href={ROUTES.SONG_RUN_DETAIL(workflow.song_id, workflow.run_id)}>
      <div className="flex items-start justify-between p-3 rounded-lg hover:bg-panel transition-colors cursor-pointer group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
          <p className="text-sm text-text-base truncate">
            {workflow.current_node ? `${workflow.current_node} node` : 'Workflow run'}
          </p>
          <p className="text-xs text-text-muted">
            {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="p-3 rounded-lg">
      <Skeleton className="h-5 w-20 mb-2 rounded-full" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

function EntityStatItem({
  label,
  count,
  icon,
  href
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between py-2 group cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="text-text-muted group-hover:text-primary transition-colors">
            {icon}
          </div>
          <span className="text-sm font-medium text-text-base group-hover:text-primary transition-colors">
            {label}
          </span>
        </div>
        <span className="text-sm font-semibold text-text-strong">
          {count}
        </span>
      </div>
    </Link>
  );
}

function StatusItem({ label, status }: { label: string; status: 'operational' | 'degraded' | 'down' }) {
  const statusConfig = {
    operational: { color: 'bg-success', text: 'Operational', textColor: 'text-success' },
    degraded: { color: 'bg-warning', text: 'Degraded', textColor: 'text-warning' },
    down: { color: 'bg-danger', text: 'Down', textColor: 'text-danger' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-text-base">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
        <span className={`text-sm font-medium ${config.textColor}`}>{config.text}</span>
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
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-semibold text-lg">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-text-strong mb-2">{title}</h3>
        <p className="text-sm text-text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
