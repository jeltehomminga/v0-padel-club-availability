/**
 * Static map of Playtomic resource_id → human-readable court name.
 *
 * The Playtomic /v1/resources endpoint is not publicly accessible (returns 404).
 * Court names are sourced directly from https://playtomic.io/tenant/{tenantId}
 * and matched to the resource UUIDs observed in the /v1/availability responses.
 *
 * Keyed by tenantId::resourceId to prevent name collisions across clubs that
 * share the same resource UUID (which can happen with duplicate tenant records).
 */

// tenant::resource → court name
const TENANT_COURT_NAMES: Record<string, string> = {
  // ── Bam Bam Padel | Ubud Bali (9a18884f) ─────────────────────────────────
  // Source: https://playtomic.io/tenant/9a18884f-0b5a-4013-bcb5-16acc8b6de36
  // Courts: Bandeja, Golden Point, Drop Shot, Chiquita, Vibora
  "9a18884f-0b5a-4013-bcb5-16acc8b6de36::78c071c3-3ade-4254-b6f8-eb0c687f29fa": "Bandeja Court",
  "9a18884f-0b5a-4013-bcb5-16acc8b6de36::c07c691d-1c5f-473f-a457-7f467612735f": "Golden Point Court",
  "9a18884f-0b5a-4013-bcb5-16acc8b6de36::2cf59005-6a17-4018-9022-f3e197234f5c": "Drop Shot Court",
  // Chiquita and Vibora courts — resource IDs not yet observed in logs; will be resolved on next fetch
  // "9a18884f-0b5a-4013-bcb5-16acc8b6de36::???": "Chiquita Court",
  // "9a18884f-0b5a-4013-bcb5-16acc8b6de36::???": "Vibora Court",

  // ── Bisma Padel (6407c760) ────────────────────────────────────────────────
  // Source: https://playtomic.io/tenant/6407c760-c32c-4a1d-919b-3213efae187b
  // Courts: Bisma 1, Bisma 2
  "6407c760-c32c-4a1d-919b-3213efae187b::91d38986-b6b3-4f9d-b898-6daf10ae6797": "Bisma 1",
  "6407c760-c32c-4a1d-919b-3213efae187b::2400f56e-078b-499d-8770-8d59cd5e4cf9": "Bisma 2",
  "6407c760-c32c-4a1d-919b-3213efae187b::ccfdce4e-2480-4ef9-be25-ae6cad70bd44": "Bisma 2",

  // ── Monkey Padel Bali Sayan Ubud (325afbbf) ───────────────────────────────
  // Source: https://monkeypadelbali.com / Playtomic app
  "325afbbf-2acc-473b-b93c-0dd30b4adff3::6dade228-7e05-4421-a2a0-11d0c82d90a2": "Court 1",
  "325afbbf-2acc-473b-b93c-0dd30b4adff3::a0756f12-de0f-4380-87aa-0cab805caa3f": "Court 2",
  "325afbbf-2acc-473b-b93c-0dd30b4adff3::ccfdce4e-2480-4ef9-be25-ae6cad70bd44": "Court 3",

  // ── Padel of Gods / Gods Social Club (bc8e4a3c & c32d1739) ───────────────
  // Source: https://padelofgodsbali.com
  "bc8e4a3c-62b1-4161-9b5d-d05eed1a1378::4ea93257-de35-4578-8c56-7107421bafde": "Court 1",
  "bc8e4a3c-62b1-4161-9b5d-d05eed1a1378::02245c98-eeb8-4218-93d1-7e9246a9be17": "Court 2",
  "c32d1739-bfd4-481f-9146-fcb8b6acac3c::dba606ad-692b-4eac-8378-9f01c4a7601c": "Court 1",
  "c32d1739-bfd4-481f-9146-fcb8b6acac3c::05e7214d-aee0-48f7-9b91-f0871c63ee6b": "Court 2",

  // ── Simply Padel Sanur (48c00d13, e8eb5e6f, 8e6debc5) ────────────────────
  // Source: https://playtomic.io/tenant/48c00d13-d40e-494f-86b1-1defd37c81eb
  // Courts: Court 1 (Satu), Court 2 (Dua), Court 3 (Tiga)
  "48c00d13-d40e-494f-86b1-1defd37c81eb::156a30d0-f316-4e5b-a3b2-660a3ecc87c2": "Court 1 (Satu)",
  "e8eb5e6f-6bca-4e0d-a527-5f34af8af6af::1a3cb35d-9079-4c4b-a3b6-e25b9b3bd232": "Court 1 (Satu)",
  "8e6debc5-34b0-4e24-be1c-cae3e5bc1fb3::5dc61d47-6d79-4063-875c-91bd5e9b0694": "Court 2 (Dua)",

  // ── Bisma Padel alternate tenant (5ad933a3) ───────────────────────────────
  "5ad933a3-5f0d-40e2-a6db-302c47950a25::350bcb71-1045-4540-92c8-1fba02aa9d0b": "Bisma 1",
}

/**
 * Returns the human-readable court name for a given tenant + resource UUID pair.
 * Falls back to a short readable ID fragment if not yet mapped.
 */
export function getCourtName(tenantId: string, resourceId: string): string {
  return (
    TENANT_COURT_NAMES[`${tenantId}::${resourceId}`] ??
    `Court ${resourceId.substring(0, 8)}`
  )
}
