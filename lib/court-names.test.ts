import { describe, it, expect, beforeEach } from "vitest"
import {
  getCourtName,
  isUnmappedCourt,
  setCourtNames,
  clearDynamicCache,
  FALLBACK_COURT_NAMES,
} from "@/lib/court-names"

beforeEach(() => {
  clearDynamicCache()
})

describe("getCourtName", () => {
  it("returns fallback name for known tenant::resource pair", () => {
    expect(
      getCourtName("9a18884f-0b5a-4013-bcb5-16acc8b6de36", "a7c47627-xxxx"),
    ).toBe("Bandeja Court")
  })

  it("uses first 8 chars of each UUID as key", () => {
    expect(getCourtName("9a18884f-anything", "a7c47627-anything")).toBe(
      "Bandeja Court",
    )
  })

  it("returns Court + 8-char fragment for completely unknown pair", () => {
    const name = getCourtName("unknown12-xxxx", "abcdef01-xxxx")
    expect(name).toBe("Court abcdef01")
  })

  it("handles short IDs by substring", () => {
    const name = getCourtName("9a18884f", "a7c47627")
    expect(name).toBe("Bandeja Court")
  })
})

describe("dynamic court name cache", () => {
  it("dynamic cache takes precedence over fallback map", () => {
    expect(getCourtName("9a18884f", "a7c47627")).toBe("Bandeja Court")

    setCourtNames("9a18884f-full-uuid", [
      { resource_id: "a7c47627-full-uuid", name: "  Renamed Court  " },
    ])

    expect(getCourtName("9a18884f", "a7c47627")).toBe("Renamed Court")
  })

  it("trims whitespace from API court names", () => {
    setCourtNames("test-tenant-id", [
      { resource_id: "res12345-uuid", name: "  Court With Spaces  " },
    ])
    expect(getCourtName("test-ten", "res12345")).toBe("Court With Spaces")
  })

  it("falls back to static map when dynamic cache is cleared", () => {
    setCourtNames("9a18884f-full-uuid", [
      { resource_id: "a7c47627-full-uuid", name: "Override" },
    ])
    expect(getCourtName("9a18884f", "a7c47627")).toBe("Override")

    clearDynamicCache()
    expect(getCourtName("9a18884f", "a7c47627")).toBe("Bandeja Court")
  })

  it("handles multiple resources for same tenant", () => {
    setCourtNames("48c00d13-full-uuid", [
      { resource_id: "62532960-uuid", name: "Court 1 (Satu)" },
      { resource_id: "8a0bff4d-uuid", name: "Court 2 (Dua)" },
      { resource_id: "156a30d0-uuid", name: "Court 3 (Tiga)" },
    ])
    expect(getCourtName("48c00d13", "62532960")).toBe("Court 1 (Satu)")
    expect(getCourtName("48c00d13", "8a0bff4d")).toBe("Court 2 (Dua)")
    expect(getCourtName("48c00d13", "156a30d0")).toBe("Court 3 (Tiga)")
  })

  it("falls through to UUID fragment for unknown resource on known tenant", () => {
    setCourtNames("48c00d13-full-uuid", [
      { resource_id: "62532960-uuid", name: "Court 1" },
    ])
    expect(getCourtName("48c00d13", "ffffffff-unknown")).toBe("Court ffffffff")
  })
})

describe("isUnmappedCourt", () => {
  it("returns true for fallback Court XXXXXXXX format", () => {
    expect(isUnmappedCourt("Court abcdef01")).toBe(true)
  })

  it("returns false for mapped human-readable names", () => {
    expect(isUnmappedCourt("Bandeja Court")).toBe(false)
    expect(isUnmappedCourt("Court 1 (Satu)")).toBe(false)
    expect(isUnmappedCourt("Padel 1")).toBe(false)
    expect(isUnmappedCourt("South Court")).toBe(false)
  })
})

describe("FALLBACK_COURT_NAMES integrity", () => {
  it("has entries for all known tenants", () => {
    const tenantKeys = new Set(
      Object.keys(FALLBACK_COURT_NAMES).map((k) => k.split("::")[0]),
    )
    expect(tenantKeys.size).toBeGreaterThanOrEqual(10)
  })

  it("every entry has a non-empty name", () => {
    for (const [key, name] of Object.entries(FALLBACK_COURT_NAMES)) {
      expect(name.trim().length, `empty name for ${key}`).toBeGreaterThan(0)
    }
  })

  it("no entry uses the unmapped fallback pattern as a name", () => {
    for (const [key, name] of Object.entries(FALLBACK_COURT_NAMES)) {
      expect(isUnmappedCourt(name), `${key} has unmapped name "${name}"`).toBe(
        false,
      )
    }
  })
})
