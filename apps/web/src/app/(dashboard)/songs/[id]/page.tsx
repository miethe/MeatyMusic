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
import { useSong, useDeleteSong } from '@/hooks/api/useSongs';
import {
  Edit,
  Play,
  Copy,
  Trash2,
  ExternalLink,
  Music2,
  Palette,
  FileText,
  User,
  Settings as SettingsIcon,
  Loader2,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;

  const { data: song, isLoading, error } = useSong(songId);
  const deleteSong = useDeleteSong();

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
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
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
              <EntityCard
                title="Style"
                icon={<Palette className="w-5 h-5" />}
                entityId={song.style_id}
                createHref={ROUTES.ENTITIES.STYLE_NEW}
              />
              <EntityCard
                title="Lyrics"
                icon={<FileText className="w-5 h-5" />}
                entityId={null} // TODO: Fetch lyrics for this song
                createHref={ROUTES.ENTITIES.LYRICS_NEW}
              />
              <EntityCard
                title="Persona"
                icon={<User className="w-5 h-5" />}
                entityId={song.persona_id}
                createHref={ROUTES.ENTITIES.PERSONA_NEW}
              />
              <EntityCard
                title="Blueprint"
                icon={<SettingsIcon className="w-5 h-5" />}
                entityId={song.blueprint_id}
                createHref={ROUTES.ENTITIES.BLUEPRINT_NEW}
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
        </Tabs>
      </div>
    </div>
  );
}

function EntityCard({
  title,
  icon,
  entityId,
  createHref,
}: {
  title: string;
  icon: React.ReactNode;
  entityId: string | null | undefined;
  createHref: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-primary">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      {entityId ? (
        <div>
          <p className="font-medium mb-2 font-mono text-sm text-muted-foreground">
            ID: {entityId}
          </p>
          <Button variant="outline" size="sm" disabled>
            <ExternalLink className="w-3 h-3 mr-2" />
            View Details (Coming Soon)
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            No {title.toLowerCase()} assigned
          </p>
          <Link href={createHref}>
            <Button variant="outline" size="sm">
              Create {title}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
