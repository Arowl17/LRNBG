import {
  alphabetBundleSchema,
  courseManifestSchema,
  type AlphabetBundle,
  type CourseManifest,
  type UnitBundle,
  unitBundleSchema,
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

const unitPromises = new Map<string, Promise<UnitBundle>>();

/** Load one unit's bundle (cached; the service worker keeps it for offline use). */
export function loadUnit(unitId: string, fetchFn: typeof fetch = fetch): Promise<UnitBundle> {
  let promise = unitPromises.get(unitId);
  if (!promise) {
    promise = fetchFn(`/content/units/${unitId}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`${unitId}.json: HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => unitBundleSchema.parse(data))
      .catch((error: unknown) => {
        unitPromises.delete(unitId);
        throw error;
      });
    unitPromises.set(unitId, promise);
  }
  return promise;
}

let manifestPromise: Promise<CourseManifest> | undefined;

/** The course manifest, cached for the session. */
export function courseManifest(): Promise<CourseManifest> {
  manifestPromise ??= loadCourseManifest().catch((error: unknown) => {
    manifestPromise = undefined;
    throw error;
  });
  return manifestPromise;
}

/** Test helper: forget all cached content. */
export function resetContentCache() {
  manifestPromise = undefined;
  alphabetPromise = undefined;
  unitPromises.clear();
}
