import {
  alphabetBundleSchema,
  courseManifestSchema,
  type AlphabetBundle,
  type CourseManifest,
} from './schema';

/** Load and validate the course manifest produced by `pnpm content:build`. */
export async function loadCourseManifest(fetchFn: typeof fetch = fetch): Promise<CourseManifest> {
  const response = await fetchFn('/content/course.json');
  if (!response.ok) throw new Error(`course.json: HTTP ${response.status}`);
  return courseManifestSchema.parse(await response.json());
}

let alphabetPromise: Promise<AlphabetBundle> | undefined;

/** Load the Section 0 alphabet bundle (cached for the session; the service worker caches it offline). */
export function loadAlphabet(fetchFn: typeof fetch = fetch): Promise<AlphabetBundle> {
  alphabetPromise ??= fetchFn('/content/alphabet.json')
    .then((response) => {
      if (!response.ok) throw new Error(`alphabet.json: HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => alphabetBundleSchema.parse(data))
    .catch((error: unknown) => {
      alphabetPromise = undefined; // allow a retry
      throw error;
    });
  return alphabetPromise;
}
