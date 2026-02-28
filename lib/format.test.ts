import { describe, it, expect } from "vitest"
import { formatPrice, formatCourtName } from "@/lib/format"

describe("formatPrice", () => {
  it("formats IDR with no decimals", () => {
    expect(formatPrice(150000)).toMatch(/Rp\s*150\.000/)
  })

  it("formats zero", () => {
    expect(formatPrice(0)).toMatch(/Rp\s*0/)
  })

  it("formats large amounts with thousands separators", () => {
    expect(formatPrice(500000)).toMatch(/Rp\s*500\.000/)
  })
})

describe("formatCourtName", () => {
  it("converts UUID-prefixed name to Court XXXXXXXX using slice(-8,-4)", () => {
    expect(formatCourtName("78c071c3-1234-5678-abcd-123456789abc")).toBe(
      "Court 5678",
    )
  })

  it("adds Court prefix when name does not start with Court", () => {
    expect(formatCourtName("Golden Point")).toBe("Court Golden Point")
  })

  it("leaves name unchanged when it already starts with Court", () => {
    expect(formatCourtName("Court 1 (Satu)")).toBe("Court 1 (Satu)")
  })
})
