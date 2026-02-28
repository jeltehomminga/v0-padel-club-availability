/**
 * Static map of Playtomic resource_id → human-readable court name.
 *
 * The Playtomic /v1/resources endpoint is not publicly accessible (returns 404).
 * These names are sourced from the Playtomic app and matched to the UUIDs
 * returned by the /v1/availability endpoint.
 *
 * To add a new court: open the Playtomic app, find the court, note the name,
 * then match it to the resource_id appearing in the availability response.
 */
export const COURT_NAMES: Record<string, string> = {
  // ── Bam Bam Padel Ubud ───────────────────────────────────────────────────
  "156a30d0-f316-4e5b-a3b2-660a3ecc87c2": "Court 1",
  "91d38986-b6b3-4f9d-b898-6daf10ae6797": "Court 2",

  // ── Monkey Padel Bali ─────────────────────────────────────────────────────
  "6dade228-7e05-4421-a2a0-11d0c82d90a2": "Court 1",
  "dba606ad-692b-4eac-8378-9f01c4a7601c": "Court 2",

  // ── Simply Padel Sanur ───────────────────────────────────────────────────
  "1a3cb35d-9079-4c4b-a3b6-e25b9b3bd232": "Court 1",
  "5dc61d47-6d79-4063-875c-91bd5e9b0694": "Court 2",

  // ── Padel of Gods ────────────────────────────────────────────────────────
  "05e7214d-aee0-48f7-9b91-f0871c63ee6b": "Court 1",
  "2f28606b-f071-47d1-8d57-c219b1547192": "Court 2",

  // ── Bisma Padel ──────────────────────────────────────────────────────────
  "350bcb71-1045-4540-92c8-1fba02aa9d0b": "Court 1",

  // ── Sanur clubs (resource IDs seen in logs) ───────────────────────────────
  "78c071c3-3ade-4254-b6f8-eb0c687f29fa": "Court 1",
  "2cf59005-6a17-4018-9022-f3e197234f5c": "Court 2",

  // ── Additional courts seen in duplicate-key warnings ─────────────────────
  "2400f56e-078b-499d-8770-8d59cd5e4cf9": "Court 1",
  "ccfdce4e-2480-4ef9-be25-ae6cad70bd44": "Court 1",
}

/**
 * Returns the human-readable court name for a given resource UUID.
 * Falls back to "Court N" with a short ID fragment if not yet mapped.
 */
export function getCourtName(resourceId: string): string {
  return COURT_NAMES[resourceId] ?? `Court ${resourceId.substring(0, 8)}`
}
