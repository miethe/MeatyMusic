'use client';

import * as React from 'react';

import Link from 'next/link';

import { Button, Card, Input, Label, Textarea } from '@meatymusic/ui';

import { useCreateMotif, useCreateStory, useSongStories, useUpdateMotif, useUpdateStory, useWorkflowRuns } from '@/hooks/api';
import { StoryRevisionConflictError } from '@/lib/api/stories';
import type { SongStory, SongMotif } from '@/types/api';

export function SongStoryPanel({ songId }: { songId: string }) {
  const { data: stories = [], isLoading, error, refetch } = useSongStories(songId);
  const { data: runsData } = useWorkflowRuns({ song_id: songId, limit: 100 });
  const runs = runsData?.items ?? [];
  const createStory = useCreateStory(songId);
  const updateStory = useUpdateStory(songId);
  const createMotif = useCreateMotif(songId);
  const updateMotif = useUpdateMotif(songId);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [takeId, setTakeId] = React.useState('');
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState({ title: '', body: '', take_id: '' });
  const [motifDrafts, setMotifDrafts] = React.useState<Record<string, { label: string; notes: string; start: string; end: string; take_id: string }>>({});
  const [editMotif, setEditMotif] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState('');
  const [motifErrors, setMotifErrors] = React.useState<Record<string, string>>({});
  const beginEdit = (story: SongStory) => { setEditing(story.id); setDraft({ title: story.title, body: story.body_text, take_id: story.take_id || '' }); setFormError(''); };
  const saveStory = async (story: SongStory) => {
    setFormError('');
    try {
      await updateStory.mutateAsync({ storyId: story.id, payload: { expected_revision: story.revision, title: draft.title, body_text: draft.body, take_id: draft.take_id || null } });
      setEditing(null);
    } catch (e) {
      setFormError(e instanceof StoryRevisionConflictError ? e.message : (e as Error).message || 'Unable to update story.');
    }
  };
  const submitStory = async (event: React.FormEvent) => {
    event.preventDefault(); setFormError('');
    try { await createStory.mutateAsync({ title, body_text: body, take_id: takeId || null }); setTitle(''); setBody(''); setTakeId(''); }
    catch (e) { setFormError((e as Error).message || 'Unable to create story.'); }
  };
  const runLabel = (id: string | null) => id ? (runs.find((run) => run.id === id)?.status ? `${id} (${runs.find((run) => run.id === id)?.status})` : id) : 'No take';
  const takeOptions = (name: string, value: string, onChange: (value: string) => void) => <div><Label htmlFor={name} className="block">Take (optional)</Label><select id={name} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 flex h-9 w-full rounded-sm border border-[var(--mp-color-border)] bg-[var(--mp-color-surface)] px-3 py-1 text-sm text-[var(--mp-color-text-base)] shadow-sm transition-all duration-[var(--mp-motion-duration-ui)] ease-out hover:border-[var(--mp-color-primary)]/30 hover:brightness-[1.02] focus-visible:border-[var(--mp-color-primary)] focus-visible:bg-[var(--mp-color-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mp-color-ring)] focus-visible:shadow-md"><option value="">No take</option>{runs.map((run) => <option key={run.id} value={run.id}>{run.id} · {run.status || 'run'}</option>)}</select></div>;
  const motifValue = (storyId: string) => motifDrafts[storyId] || { label: '', notes: '', start: '', end: '', take_id: '' };
  const setMotifValue = (storyId: string, value: Partial<ReturnType<typeof motifValue>>) => setMotifDrafts((all) => ({ ...all, [storyId]: { ...motifValue(storyId), ...value } }));
  const anchorFrom = (start: string, end: string) => start !== '' || end !== '' ? { ...(start !== '' ? { start_seconds: Number(start) } : {}), ...(end !== '' ? { end_seconds: Number(end) } : {}) } : null;
  const motifForm = (story: SongStory, motif?: SongMotif) => {
    const value = motifDrafts[motif?.id || story.id] || { label: motif?.label || '', notes: motif?.notes || '', start: String(motif?.anchor?.start_seconds ?? ''), end: String(motif?.anchor?.end_seconds ?? ''), take_id: motif?.take_id || '' };
    const key = motif?.id || story.id;
    return <form className="mt-3 grid gap-3 rounded border p-3" onSubmit={async (e) => { e.preventDefault(); setMotifErrors((all) => ({ ...all, [key]: '' })); try {
      if (motif) { await updateMotif.mutateAsync({ storyId: story.id, motifId: motif.id, payload: { expected_revision: motif.revision, label: value.label, notes: value.notes || null, anchor: anchorFrom(value.start, value.end), take_id: value.take_id || null } }); setEditMotif(null); }
      else { await createMotif.mutateAsync({ storyId: story.id, payload: { label: value.label, notes: value.notes || null, anchor: anchorFrom(value.start, value.end), take_id: value.take_id || null } }); setMotifDrafts((all) => ({ ...all, [story.id]: { label: '', notes: '', start: '', end: '', take_id: '' } })); }
    } catch (err) { setMotifErrors((all) => ({ ...all, [key]: (err as Error).message || 'Unable to save motif.' })); } }}>
      <div><Label htmlFor={`${key}-label`} className="block">Motif label</Label><Input id={`${key}-label`} required maxLength={200} value={value.label} onChange={(e) => setMotifValue(key, { label: e.target.value })} className="mt-1" /></div>
      <div><Label htmlFor={`${key}-notes`} className="block">Notes</Label><Textarea id={`${key}-notes`} value={value.notes} onChange={(e) => setMotifValue(key, { notes: e.target.value })} className="mt-1" showValidationIcon={false} /></div>
      <div className="grid grid-cols-2 gap-3"><div><Label htmlFor={`${key}-start`} className="block">Start seconds (optional)</Label><Input id={`${key}-start`} type="number" min="0" step="any" value={value.start} onChange={(e) => setMotifValue(key, { start: e.target.value })} className="mt-1" /></div><div><Label htmlFor={`${key}-end`} className="block">End seconds (optional)</Label><Input id={`${key}-end`} type="number" min="0" step="any" value={value.end} onChange={(e) => setMotifValue(key, { end: e.target.value })} className="mt-1" /></div></div>
      {takeOptions(`${key}-take`, value.take_id, (v) => setMotifValue(key, { take_id: v }))}
      {motifErrors[key] && <p role="alert" className="text-destructive">{motifErrors[key]}</p>}
      <Button type="submit">{motif ? 'Save motif' : 'Add motif'}</Button>
    </form>;
  };
  return <section aria-labelledby="song-story-heading" className="space-y-6"><h2 id="song-story-heading" className="text-xl font-semibold">Stories</h2>
    {isLoading && <p role="status">Loading stories…</p>}{error && <div role="alert" className="text-destructive">Unable to load stories. <Button type="button" onClick={() => refetch()}>Reload</Button></div>}
    {!isLoading && !error && stories.length === 0 && <p>No stories yet. Create the first story for this song.</p>}
    {stories.map((story) => <Card key={story.id} className="space-y-4 p-5"><header className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-lg font-semibold">{story.title}</h3><p className="text-sm text-muted-foreground">Take: {story.take_id ? <Link className="underline" href={`/songs/${songId}/workflow?runId=${story.take_id}`}>{runLabel(story.take_id)}</Link> : 'No take'} · Revision {story.revision}</p></div>{editing !== story.id && <Button type="button" onClick={() => beginEdit(story)}>Edit story</Button>}</header>
      {editing === story.id ? <div className="space-y-3"><div><Label htmlFor={`story-${story.id}-title`} className="block">Title</Label><Input id={`story-${story.id}-title`} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1" /></div><div><Label htmlFor={`story-${story.id}-body`} className="block">Story text</Label><Textarea id={`story-${story.id}-body`} rows={6} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="mt-1" showValidationIcon={false} /></div>{takeOptions(`story-${story.id}-take`, draft.take_id, (v) => setDraft({ ...draft, take_id: v }))}{formError && <div role="alert" className="text-destructive">{formError}{formError.includes('changed elsewhere') && <Button type="button" onClick={() => { setEditing(null); void refetch(); }}>Reload</Button>}</div>}<div className="flex gap-2"><Button type="button" onClick={() => saveStory(story)}>Save story</Button><Button type="button" onClick={() => setEditing(null)}>Cancel</Button></div></div> : <p className="whitespace-pre-wrap">{story.body_text}</p>}
      <div className="border-t pt-4"><h4 className="font-medium">Motifs</h4>{(story.motifs || []).length === 0 && <p className="mt-2 text-sm text-muted-foreground">No motifs yet.</p>}<ul className="mt-2 space-y-3">{(story.motifs || []).map((motif) => <li key={motif.id} className="rounded border p-3"><div className="flex justify-between gap-3"><div><strong>{motif.label}</strong> · Revision {motif.revision}<p className="whitespace-pre-wrap">{motif.notes}</p><p className="text-sm">Take: {runLabel(motif.take_id)}{motif.anchor && ` · ${String(motif.anchor.start_seconds ?? '')}–${String(motif.anchor.end_seconds ?? '')} sec`}</p></div>{editMotif !== motif.id && <Button type="button" onClick={() => { setEditMotif(motif.id); setMotifDrafts((all) => ({ ...all, [motif.id]: { label: motif.label, notes: motif.notes || '', start: String(motif.anchor?.start_seconds ?? ''), end: String(motif.anchor?.end_seconds ?? ''), take_id: motif.take_id || '' } })); }}>Edit motif</Button>}</div>{editMotif === motif.id && motifForm(story, motif)}</li>)}</ul>{motifForm(story)}</div>
    </Card>)}
    <Card className="space-y-4 p-5"><h3 className="text-lg font-semibold">Create story</h3><form className="space-y-3" onSubmit={submitStory}><div><Label htmlFor="new-story-title" className="block">Title</Label><Input id="new-story-title" required maxLength={500} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" /></div><div><Label htmlFor="new-story-body" className="block">Story text</Label><Textarea id="new-story-body" required rows={6} value={body} onChange={(e) => setBody(e.target.value)} className="mt-1" showValidationIcon={false} /></div>{takeOptions('new-story-take', takeId, setTakeId)}{formError && editing === null && <p role="alert" className="text-destructive">{formError}</p>}<Button type="submit" disabled={createStory.isPending}>Create story</Button></form></Card>
  </section>;
}
