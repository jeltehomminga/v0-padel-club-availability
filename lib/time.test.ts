import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { convertToBaliTime, getDateString, getNext14Days } from "@/lib/time"

describe("convertToBaliTime", () => {
  it("converts UTC HH:MM:SS to Bali (UTC+8)", () => {
    expect(convertToBaliTime("00:00:00")).toBe("08:00:00")
    expect(convertToBaliTime("16:00:00")).toBe("00:00:00")
  })

  it("wraps hour past 24", () => {
    expect(convertToBaliTime("20:30:00")).toBe("04:30:00")
  })

  it("pads single-digit hours and minutes", () => {
    expect(convertToBaliTime("01:05:03")).toBe("09:05:03")
  })

  it("returns input when empty or invalid", () => {
    expect(convertToBaliTime("")).toBe("")
    expect(convertToBaliTime("invalid")).toBe("invalid")
  })
})

describe("getDateString", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-02-28T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns today as YYYY-MM-DD when offset is 0", () => {
    expect(getDateString(0)).toBe("2026-02-28")
  })

  it("returns tomorrow when offset is 1", () => {
    expect(getDateString(1)).toBe("2026-03-01")
  })

  it("returns yesterday when offset is -1", () => {
    expect(getDateString(-1)).toBe("2026-02-27")
  })
})

describe("getNext14Days", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-02-28T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns 14 date strings starting from today", () => {
    const days = getNext14Days()
    expect(days).toHaveLength(14)
    expect(days[0]).toBe("2026-02-28")
    expect(days[13]).toBe("2026-03-13")
  })
})
