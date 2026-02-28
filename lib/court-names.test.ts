import { describe, it, expect } from "vitest"
import { getCourtName, isUnmappedCourt } from "@/lib/court-names"

describe("getCourtName", () => {
  it("returns mapped name for known tenant::resource pair", () => {
    expect(
      getCourtName("9a18884f-0b5a-4013-bcb5-16acc8b6de36", "78c071c3-xxxx"),
    ).toBe("Bandeja Court")
  })

  it("uses first 8 chars of each UUID as key", () => {
    expect(getCourtName("9a18884f-anything", "78c071c3-anything")).toBe(
      "Bandeja Court",
    )
  })

  it("returns Court + 8-char fragment for unknown pair", () => {
    const name = getCourtName("unknown12-xxxx", "abcdef01-xxxx")
    expect(name).toBe("Court abcdef01")
  })

  it("handles short IDs by substring", () => {
    const name = getCourtName("9a18884f", "78c071c3")
    expect(name).toBe("Bandeja Court")
  })
})

describe("isUnmappedCourt", () => {
  it("returns true for fallback Court XXXXXXXX format", () => {
    expect(isUnmappedCourt("Court abcdef01")).toBe(true)
  })

  it("returns false for mapped human-readable names", () => {
    expect(isUnmappedCourt("Bandeja Court")).toBe(false)
    expect(isUnmappedCourt("Court 1 (Satu)")).toBe(false)
  })
})
