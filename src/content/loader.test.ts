import { describe, expect, it } from 'vitest';
import { loadCourseManifest } from './loader';

const respond =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('loadCourseManifest', () => {
  it('returns a validated manifest', async () => {
    const manifest = await loadCourseManifest(respond({ contentVersion: 'v1', units: [] }));
    expect(manifest.units).toEqual([]);
  });

  it('throws on HTTP errors', async () => {
    await expect(loadCourseManifest(respond({}, 404))).rejects.toThrow('HTTP 404');
  });

  it('throws on invalid content', async () => {
    await expect(loadCourseManifest(respond({ units: 'nope' }))).rejects.toThrow();
  });
});
