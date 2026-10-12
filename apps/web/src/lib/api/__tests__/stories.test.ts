import { apiClient } from '../client';
import { storiesApi, StoryRevisionConflictError } from '../stories';

jest.mock('../client', () => ({ apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
const mocked = apiClient as jest.Mocked<typeof apiClient>;
beforeEach(() => jest.clearAllMocks());

it('sends a fresh idempotency key for distinct successful create actions', async () => {
  (mocked.post as jest.Mock).mockResolvedValue({ data: { id: 's' } });
  const payload = { title: 'Title', body_text: 'Body', take_id: 'run-1' };
  await storiesApi.create('song-1', payload); await storiesApi.create('song-1', payload);
  const first = (mocked.post as jest.Mock).mock.calls[0][2].headers['Idempotency-Key'];
  const second = (mocked.post as jest.Mock).mock.calls[1][2].headers['Idempotency-Key'];
  expect(first).toBeTruthy(); expect(second).toBeTruthy(); expect(second).not.toBe(first);
  expect(mocked.post).toHaveBeenCalledWith('/songs/song-1/stories', payload, expect.objectContaining({ headers: { 'Idempotency-Key': expect.any(String) } }));
});

it('reuses a key when retrying the same failed pending submission', async () => {
  (mocked.post as jest.Mock).mockRejectedValueOnce(new Error('temporary')).mockResolvedValueOnce({ data: { id: 's' } });
  const payload = { title: 'Retry title', body_text: 'Body' };
  await expect(storiesApi.create('song-retry', payload)).rejects.toThrow('temporary');
  await storiesApi.create('song-retry', payload);
  expect((mocked.post as jest.Mock).mock.calls[0][2].headers['Idempotency-Key']).toBe((mocked.post as jest.Mock).mock.calls[1][2].headers['Idempotency-Key']);
});

it('sends expected revision and mutation idempotency header on story patch', async () => {
  (mocked.patch as jest.Mock).mockResolvedValue({ data: { id: 'story-1', revision: 2 } });
  await storiesApi.update('song-1', 'story-1', { expected_revision: 1, title: 'Updated' });
  expect(mocked.patch).toHaveBeenCalledWith('/songs/song-1/stories/story-1', { expected_revision: 1, title: 'Updated' }, expect.objectContaining({ headers: { 'Idempotency-Key': expect.any(String) } }));
});

it('surfaces 409 current_revision as a typed revision conflict', async () => {
  (mocked.patch as jest.Mock).mockRejectedValue({ status: 409, details: { current_revision: 7 } });
  try {
    await storiesApi.update('song-1', 'story-1', { expected_revision: 2, body_text: 'Draft' });
    throw new Error('Expected revision conflict');
  } catch (error) {
    expect(error).toBeInstanceOf(StoryRevisionConflictError);
    expect(error).toMatchObject({ current_revision: 7 });
    expect(error).toHaveProperty('message', 'This story changed elsewhere (now revision 7). Reload to continue.');
  }
});
