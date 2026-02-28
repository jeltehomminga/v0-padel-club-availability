/**
 * Court name resolution for Playtomic resources.
 *
 * Primary: fetches names dynamically from /v1/tenants/{id}/resources (cached 24h).
 * Fallback: static map below, used when the API is unreachable.
 *
 * The static map is auto-verified by tests against the live API.
 */
const FALLBACK_COURT_NAMES: Record<string, string> = {
  // ── Bam Bam Padel | Ubud Bali (9a18884f) ─────────────────────────────────
  "9a18884f::a7c47627": "Bandeja Court",
  "9a18884f::78c071c3": "Golden Point Court",
  "9a18884f::c07c691d": "Drop Shot Court",
  "9a18884f::190bc9d2": "Chiquita Court",
  "9a18884f::2cf59005": "Vibora Court",

  // ── Gods Social Club / Padel of Gods (e8eb5e6f) ───────────────────────────
  "e8eb5e6f::5c766963": "Karma",
  "e8eb5e6f::1a3cb35d": "Dharma",
  "e8eb5e6f::5b754cd1": "Purgatory (Outdoor)",

  // ── Simply Padel Sanur (48c00d13) ─────────────────────────────────────────
  "48c00d13::62532960": "Court 1 (Satu)",
  "48c00d13::8a0bff4d": "Court 2 (Dua)",
  "48c00d13::156a30d0": "Court 3 (Tiga)",

  // ── FINE GROUND (8e6debc5) ────────────────────────────────────────────────
  "8e6debc5::da0a3656": "South Court",
  "8e6debc5::5dc61d47": "North Court",

  // ── Bisma Padel (6407c760) ────────────────────────────────────────────────
  "6407c760::91d38986": "Bisma 1",
  "6407c760::2400f56e": "Bisma 2",

  // ── Monkey Padel Bali Sayan Ubud (5ad933a3) ───────────────────────────────
  "5ad933a3::350bcb71": "Center Court",
  "5ad933a3::b12a8cb9": "Court 2",
  "5ad933a3::3b5e99ff": "Court 3",

  // ── TAO Padel Academy (bc8e4a3c) ──────────────────────────────────────────
  "bc8e4a3c::b8002086": "Court 1",
  "bc8e4a3c::4ea93257": "Court 2",
  "bc8e4a3c::05e7214d": "Court 3",
  "bc8e4a3c::02245c98": "Court 4",

  // ── Mahima Tennis, Padel & Gym (325afbbf) ─────────────────────────────────
  "325afbbf::ccfdce4e": "Padel 1",
  "325afbbf::6dade228": "Padel 2",
  "325afbbf::a0756f12": "Padel 3",

  // ── Prime Padel & Pickle (c32d1739) ───────────────────────────────────────
  "c32d1739::11ef4c74": "Padel 1",
  "c32d1739::dba606ad": "Padel 2",

  // ── Padel Dise Bali (6ca040f6) ────────────────────────────────────────────
  "6ca040f6::2f28606b": "Padel 1",
  "6ca040f6::11e070ec": "Padel 2",
  "6ca040f6::17133465": "Padel 3",
  "6ca040f6::0666822e": "Padel 4",
}

// ─── Dynamic court name cache ────────────────────────────────────────────────
// Maps tenantId (first 8 chars) → { resourceId8 → name }
const dynamicCourtNames = new Map<string, Map<string, string>>()

export function buildKey(tenantId: string, resourceId: string) {
  return {
    tenantKey: tenantId.substring(0, 8),
    resourceKey: resourceId.substring(0, 8),
  }
}

/**
 * Populate the dynamic cache for a tenant with resource names from the API.
 * Called during slot fetching so court names are always fresh.
 */
export function setCourtNames(
  tenantId: string,
  resources: { resource_id: string; name: string }[],
): void {
  const tenantKey = tenantId.substring(0, 8)
  const map = new Map<string, string>()
  for (const r of resources) {
    map.set(r.resource_id.substring(0, 8), r.name.trim())
  }
  dynamicCourtNames.set(tenantKey, map)
}

/**
 * Returns the human-readable court name for a given tenant + resource UUID pair.
 *
 * Resolution order:
 *  1. Dynamic cache (populated from /v1/tenants/{id}/resources)
 *  2. Static fallback map
 *  3. Short UUID fragment
 */
export function getCourtName(tenantId: string, resourceId: string): string {
  const { tenantKey, resourceKey } = buildKey(tenantId, resourceId)

  const dynamic = dynamicCourtNames.get(tenantKey)?.get(resourceKey)
  if (dynamic) return dynamic

  const fallback = FALLBACK_COURT_NAMES[`${tenantKey}::${resourceKey}`]
  if (fallback) return fallback

  return `Court ${resourceKey}`
}

/**
 * Returns true if the court name is still an unmapped fallback.
 */
export function isUnmappedCourt(name: string): boolean {
  return /^Court [0-9a-f]{8}$/.test(name)
}

/** Visible for testing. */
export function clearDynamicCache(): void {
  dynamicCourtNames.clear()
}

/** Visible for testing. */
export { FALLBACK_COURT_NAMES }
