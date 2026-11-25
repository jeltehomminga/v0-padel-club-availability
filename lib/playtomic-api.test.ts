import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fetchSlotsForDate } from "@/lib/playtomic-api"
import { serverCache } from "@/lib/cache"

describe("serverFetch failures", () => {
  beforeEach(() => {
    serverCache.clear()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("logs status and URL on a non-2xx response and returns no slots", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("blocked", { status: 503 })),
    )

    expect(await fetchSlotsForDate("2026-11-26")).toEqual([])
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/^\[playtomic\] 503 https:\/\/.*\/tenants\?/),
    )
  })

  it("logs the URL and error when fetch throws", async () => {
    const dnsError = Object.assign(new TypeError("fetch failed"), {
      cause: { code: "ENOTFOUND" },
    })
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(dnsError))

    expect(await fetchSlotsForDate("2026-11-27")).toEqual([])
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/^\[playtomic\] fetch failed https:\/\/.*\/tenants\?/),
      dnsError,
    )
  })

  it("does not retry a failed tenant fetch within the cache window", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 503 }))
    vi.stubGlobal("fetch", fetchMock)

    await fetchSlotsForDate("2026-11-28")
    await fetchSlotsForDate("2026-11-29")

    expect(fetchMock).toHaveBeenCalledTimes(2) // once per area, first call only
  })
})
