/*
 * Manifest loading + validation. Every consumer goes through here; no component
 * ever touches raw JSON. A manifest that fails schema validation surfaces a
 * clear, field-named error instead of crashing the app.
 */

import { DOMAIN_IDS, Manifest, ManifestSchema } from "./manifest";

export type LoadResult =
  | { ok: true; id: string; manifest: Manifest }
  | { ok: false; id: string; error: string };

function basePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

/** Map a domain id to its published manifest path under /public/data. */
export function manifestPath(id: string): string {
  return `${basePath()}/data/${id}.json`;
}

export async function loadManifest(id: string): Promise<LoadResult> {
  let raw: unknown;
  try {
    const res = await fetch(manifestPath(id), { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, id, error: `could not fetch manifest (HTTP ${res.status})` };
    }
    raw = await res.json();
  } catch (e) {
    return { ok: false, id, error: `could not read manifest: ${(e as Error).message}` };
  }

  const parsed = ManifestSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.join(".") || "(root)";
    return { ok: false, id, error: `invalid manifest at "${where}": ${first?.message}` };
  }
  return { ok: true, id, manifest: parsed.data };
}

/** Load all four domain manifests; each result carries its own ok/error. */
export async function loadManifests(ids: readonly string[] = DOMAIN_IDS): Promise<LoadResult[]> {
  return Promise.all(ids.map((id) => loadManifest(id)));
}
