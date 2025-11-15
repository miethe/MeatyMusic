/**
 * Song Detail Page
 * Display song overview, workflow status, and entities
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@meatymusic/ui';
import { useSong, useDeleteSong, useSDS } from '@/hooks/api';
import { songsApi } from '@/lib/api/songs';
import { useUIStore } from '@/stores';
import { EntityDetailSection } from '@/components/songs/EntityDetailSection';
import {
  Edit,
  Play,
  Copy,
  Trash2,
  Music2,
  Loader2,
  Download,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;

  const { data: song, isLoading, error } = useSong(songId);
  const deleteSong = useDeleteSong();
  const { addToast } = useUIStore();

  const [exporting, setExporting] = React.useState(false);

  // SDS data for Preview tab - only fetch when enabled
  const [previewTabActive, setPreviewTabActive] = React.useState(false);
  const {
    data: sdsData,
    isLoading: isSdsLoading,
    error: sdsError
  } = useSDS(previewTabActive ? songId : undefined);

  const handleStartWorkflow = () => {
    console.log('Starting workflow for song:', songId);
    // TODO: Implement workflow start
  };

  const handleClone = () => {
    console.log('Cloning song:', songId);
    // TODO: Implement song cloning
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this song?')) {
      try {
        await deleteSong.mutateAsync(songId);
        router.push(ROUTES.SONGS);
      } catch (error) {
        console.error('Failed to delete song:', error);
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await songsApi.export(songId);

      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast('SDS exported successfully', 'success');
    } catch (error: any) {
      console.error('Failed to export SDS:', error);
      addToast(error?.message || 'Failed to export SDS', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === 'preview') {
      setPreviewTabActive(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-6 max-w-md text-center">
          <p className="text-destructive font-medium">Failed to load song</p>
          <p className="text-text-muted text-sm mt-2">
            {error?.message || 'Song not found'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(ROUTES.SONGS)}
          >
            Back to Songs
          </Button>
        </div>
      </div>
    );
  }

  // Extract metadata from extra_metadata
  const metadata = (song.extra_metadata || {}) as Record<string, any>;
  const description = String(metadata.description || 'No description');
  const genre = String(metadata.genre || 'Unknown');
  const mood = Array.isArray(metadata.mood) ? metadata.mood : [];

  return (
    <div className="min-h-screen">
      <PageHeader
        title={song.title}
        description={description}
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export SDS
            </Button>
            <Button variant="outline" onClick={handleClone}>
              <Copy className="w-4 h-4 mr-2" />
              Clone
            </Button>
            <Link href={ROUTES.SONG_EDIT(songId)}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button onClick={handleStartWorkflow}>
              <Play className="w-4 h-4 mr-2" />
              Start Workflow
            </Button>
          </>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Metadata */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Genre</div>
            <div className="font-semibold">{genre}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            <Badge variant="secondary">{song.status}</Badge>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Created</div>
            <div className="font-semibold">
              {new Date(song.created_at).toLocaleDateString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Updated</div>
            <div className="font-semibold">
              {new Date(song.updated_at).toLocaleDateString()}
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Song Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Description</dt>
                    <dd className="mt-1">{description}</dd>
                  </div>
                  {mood.length > 0 && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Mood</dt>
                      <dd className="mt-1 flex gap-2">
                        {mood.map((m: string) => (
                          <Badge key={m} variant="outline">{m}</Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-muted-foreground">Global Seed</dt>
                    <dd className="mt-1 font-mono text-sm">{song.global_seed}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={handleStartWorkflow}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Workflow
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export SDS
                  </Button>
                  <Link href={ROUTES.SONG_EDIT(songId)} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Song
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start text-destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Song
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="entities" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <EntityDetailSection
                entityType="style"
                entityId={song.style_id || null}
                entityData={
                  song.style_id
                    ? {
                        genre: genre,
                        bpm_min: 120,
                        bpm_max: 140,
                        key: 'C Major',
                        mood: mood as string[],
                        energy_level: 7,
                      }
                    : undefined
                }
                editHref={song.style_id ? ROUTES.ENTITIES.STYLE_DETAIL(song.style_id) : '#'}
                createHref={ROUTES.ENTITIES.STYLE_NEW}
              />
              <EntityDetailSection
                entityType="lyrics"
                entityId={null}
                entityData={undefined}
                editHref="#"
                createHref={ROUTES.ENTITIES.LYRICS_NEW}
              />
              <EntityDetailSection
                entityType="persona"
                entityId={song.persona_id || null}
                entityData={
                  song.persona_id
                    ? {
                        name: 'Default Artist',
                        vocal_range: 'Tenor',
                        delivery: ['smooth', 'powerful'],
                        kind: 'artist' as const,
                      }
                    : undefined
                }
                editHref={song.persona_id ? ROUTES.ENTITIES.PERSONA_DETAIL(song.persona_id) : '#'}
                createHref={ROUTES.ENTITIES.PERSONA_NEW}
              />
              <EntityDetailSection
                entityType="blueprint"
                entityId={song.blueprint_id || null}
                entityData={
                  song.blueprint_id
                    ? {
                        genre: genre,
                        version: '1.0',
                        rules: {
                          required_sections: ['verse', 'chorus', 'bridge'],
                          tempo_bpm: [100, 160],
                        },
                        eval_rubric: {
                          thresholds: {
                            min_total: 80,
                          },
                        },
                      }
                    : undefined
                }
                editHref={song.blueprint_id ? ROUTES.ENTITIES.BLUEPRINT_DETAIL(song.blueprint_id) : '#'}
                createHref={ROUTES.ENTITIES.BLUEPRINT_NEW}
              />
              <EntityDetailSection
                entityType="producer_notes"
                entityId={null}
                entityData={undefined}
                editHref="#"
                createHref={ROUTES.ENTITIES.PRODUCER_NOTE_NEW}
              />
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="mt-6">
            <Card className="p-6 text-center">
              <Music2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No workflow yet</h3>
              <p className="text-muted-foreground mb-6">
                Start a workflow to generate musical artifacts
              </p>
              <Button onClick={handleStartWorkflow}>
                <Play className="w-4 h-4 mr-2" />
                Start Workflow
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No workflow history yet</p>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Song Design Spec (SDS)</h3>
                <Button onClick={handleExport} variant="outline" size="sm" disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export SDS
                </Button>
              </div>

              {isSdsLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading SDS...</span>
                </div>
              )}

              {sdsError && (
                <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-6 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
                  <p className="text-destructive font-medium mb-2">Failed to load SDS</p>
                  <p className="text-sm text-muted-foreground">
                    {sdsError?.message || 'Unable to compile Song Design Spec'}
                  </p>
                </div>
              )}

              {sdsData && !isSdsLoading && !sdsError && (
                <div className="space-y-4">
                  {/* Placeholder for JsonViewer component (Task SDS-PREVIEW-010) */}
                  {/* Once JsonViewer is implemented, replace this with: */}
                  {/* <JsonViewer data={sdsData} collapsed={1} theme="dark" enableClipboard={true} /> */}

                  <div className="bg-muted/30 border-2 border-muted rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        JSON Viewer Placeholder (awaiting Task SDS-PREVIEW-010)
                      </span>
                    </div>
                    <pre className="bg-black/50 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
                      {JSON.stringify(sdsData, null, 2)}
                    </pre>
                    <div className="mt-4 text-xs text-muted-foreground">
                      This is a temporary placeholder. Once the JsonViewer component is implemented,
                      this will be replaced with an interactive JSON viewer with syntax highlighting,
                      collapsible sections, and clipboard support.
                    </div>
                  </div>

                  {/* SDS Metadata Summary */}
                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Song ID</div>
                      <div className="font-mono text-xs truncate">{sdsData.song_id}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Title</div>
                      <div className="font-semibold truncate">{sdsData.title}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Global Seed</div>
                      <div className="font-mono text-sm">{sdsData.global_seed}</div>
                    </Card>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
