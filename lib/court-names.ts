/**
 * Static map of tenantId::resourceId → human-readable court name.
 *
 * The Playtomic /v1/resources endpoint is not publicly accessible (returns 404).
 * Court names are sourced directly from playtomic.io/tenant/{tenantId} and
 * cross-referenced with the resource UUIDs observed in /v1/availability responses.
 *
 * Last verified: Feb 2026
 */
const TENANT_COURT_NAMES: Record<string, string> = {
  // ── Bam Bam Padel | Ubud Bali (9a18884f) ─────────────────────────────────
  // Source: playtomic.io/tenant/9a18884f-0b5a-4013-bcb5-16acc8b6de36
  "9a18884f::78c071c3": "Bandeja Court",
  "9a18884f::c07c691d": "Golden Point Court",
  "9a18884f::2cf59005": "Drop Shot Court",
  "9a18884f::a7c47627": "Chiquita Court",
  "9a18884f::190bc9d2": "Vibora Court",

  // ── Gods Social Club / Padel of Gods (e8eb5e6f) ───────────────────────────
  // Source: playtomic.io/tenant/e8eb5e6f-6bca-4e0d-a527-5f34af8af6af
  "e8eb5e6f::1a3cb35d": "Karma",
  "e8eb5e6f::5b754cd1": "Dharma",
  "e8eb5e6f::5c766963": "Purgatory (Outdoor)",

  // ── Simply Padel Sanur (48c00d13) ─────────────────────────────────────────
  // Source: playtomic.io/tenant/48c00d13-d40e-494f-86b1-1defd37c81eb
  "48c00d13::156a30d0": "Court 1 (Satu)",
  "48c00d13::62532960": "Court 2 (Dua)",
  "48c00d13::8a0bff4d": "Court 3 (Tiga)",

  // ── FINE GROUND (8e6debc5) ────────────────────────────────────────────────
  // Source: playtomic.io/tenant/8e6debc5-34b0-4e24-be1c-cae3e5bc1fb3
  "8e6debc5::5dc61d47": "Court 2 (Dua)",
  "8e6debc5::da0a3656": "Court 1 (Satu)",

  // ── Bisma Padel (6407c760) ────────────────────────────────────────────────
  // Source: playtomic.io/tenant/6407c760-c32c-4a1d-919b-3213efae187b
  "6407c760::91d38986": "Bisma 1",
  "6407c760::2400f56e": "Bisma 2",
  "6407c760::ccfdce4e": "Bisma 3",

  // ── Monkey Padel Bali Sayan Ubud (5ad933a3) ───────────────────────────────
  // Source: playtomic.io/tenant/5ad933a3-5f0d-40e2-a6db-302c47950a25
  "5ad933a3::350bcb71": "Center Court",
  "5ad933a3::3b5e99ff": "Court 2",
  "5ad933a3::b12a8cb9": "Court 3",

  // ── TAO Padel Academy (bc8e4a3c) ──────────────────────────────────────────
  // Source: playtomic.io/tenant/bc8e4a3c-62b1-4161-9b5d-d05eed1a1378
  "bc8e4a3c::4ea93257": "Court 1",
  "bc8e4a3c::02245c98": "Court 2",
  "bc8e4a3c::05e7214d": "Court 3",
  "bc8e4a3c::b8002086": "Court 4",

  // ── Mahima Tennis, Padel & Gym (325afbbf) ─────────────────────────────────
  // Source: playtomic.io/tenant/325afbbf-2acc-473b-b93c-0dd30b4adff3
  "325afbbf::6dade228": "Court 1",
  "325afbbf::a0756f12": "Court 2",
  "325afbbf::ccfdce4e": "Court 3",

  // ── Prime Padel & Pickle (c32d1739) ───────────────────────────────────────
  // Source: playtomic.io/tenant/c32d1739-bfd4-481f-9146-fcb8b6acac3c
  "c32d1739::dba606ad": "Court 1",
  "c32d1739::11ef4c74": "Court 2",

  // ── Padel Dise Bali (6ca040f6) ────────────────────────────────────────────
  // Source: playtomic.io/tenant/6ca040f6-0edd-4578-a63a-91258ed8381b
  "6ca040f6::2f28606b": "Court 1",
  "6ca040f6::11e070ec": "Court 2",
  "6ca040f6::0666822e": "Court 3",
}

/**
 * Returns the human-readable court name for a given tenant + resource UUID pair.
 * Uses only the first 8 characters of each UUID as the key for robustness.
 * Falls back to a short UUID fragment if the pair is not yet in the map.
 */
export function getCourtName(tenantId: string, resourceId: string): string {
  const key = `${tenantId.substring(0, 8)}::${resourceId.substring(0, 8)}`
  return TENANT_COURT_NAMES[key] ?? `Court ${resourceId.substring(0, 8)}`
}
