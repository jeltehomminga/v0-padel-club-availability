import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BookDirect } from "@/components/padel/book-direct"
import { baliClubs } from "@/lib/constants"

describe("BookDirect", () => {
  it("links each club to its Playtomic page on the selected date", () => {
    const clubs = baliClubs.filter((c) => c.location === "Sanur")
    render(<BookDirect clubs={clubs} date="2026-11-26" />)

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(clubs.length)
    clubs.forEach((club, i) => {
      expect(links[i]).toHaveAccessibleName(expect.stringContaining(club.name))
      expect(links[i]).toHaveAttribute(
        "href",
        `https://playtomic.com/clubs/${club.id}?date=2026-11-26`,
      )
    })
  })
})
