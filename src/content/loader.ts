import { courseManifestSchema, type CourseManifest } from './schema';

/** Load and validate the course manifest produced by `pnpm content:build`. */
export async function loadCourseManifest(fetchFn: typeof fetch = fetch): Promise<CourseManifest> {
  const response = await fetchFn('/content/course.json');
  if (!response.ok) throw new Error(`course.json: HTTP ${response.status}`);
  return courseManifestSchema.parse(await response.json());
}
