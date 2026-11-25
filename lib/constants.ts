import type { ClubInfo } from "@/lib/playtomic-api"

export const weekdays = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const

export const durationOptions = [
  { value: "60+", label: "60+ min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
] as const

export const playtomicTenantUrl = (
  tenantId: string,
  slug?: string,
  date?: string,
) => {
  const qs = date ? `?date=${date}` : ""
  if (slug) return `https://playtomic.com/clubs/${slug}${qs}`
  return `https://playtomic.io/tenant/${tenantId}${qs}`
}

// shortcut: hand-kept list since Playtomic's tenant search is closed; add new clubs by hand.
// id is the club's playtomic.com slug.
export const baliClubs: ClubInfo[] = [
  { id: "bam-bam-padel", name: "Bam Bam Padel | Ubud Bali", location: "Ubud" },
  { id: "bisma-padel", name: "Bisma Padel", location: "Ubud" },
  { id: "padel-of-gods", name: "Gods Social Club", location: "Ubud" },
  { id: "kula-mani-tennis-village", name: "Kula Mani Tennis Village", location: "Ubud" },
  { id: "mahima", name: "Mahima Tennis, Padel & Gym", location: "Ubud" },
  { id: "monkey-padel-bali-sayan-ubud", name: "Monkey Padel Bali Sayan Ubud", location: "Ubud" },
  { id: "sisi-padel-club", name: "Sisi Padel Club", location: "Ubud" },
  { id: "tao-padel-academy", name: "TAO Padel Academy", location: "Ubud" },
  { id: "fine-ground", name: "FINE GROUND", location: "Sanur" },
  { id: "kin-urban-ground-sanur", name: "KIN Urban Ground - Sanur", location: "Sanur" },
  { id: "padel-dise-bali", name: "Padel Dise Bali", location: "Sanur" },
  { id: "prime-padel-pickle", name: "Prime Padel & Pickle", location: "Sanur" },
  { id: "simply-padel-sanur", name: "Simply Padel Sanur", location: "Sanur" },
]

export const clubWebsites: Record<string, string> = {
  "Bam Bam Padel Ubud": "https://www.bambampadel.com",
  "BamBam Padel": "https://www.bambampadel.com",
  "Monkey Padel Bali": "https://monkeypadelbali.com",
  "Monkey Padel Bali Sayan Ubud": "https://monkeypadelbali.com",
  "Simply Padel": "https://simply-padel.com",
  "Simply Padel Sanur": "https://simply-padel.com",
  "Padel of Gods": "https://padelofgodsbali.com",
  "Padel of Gods Bali": "https://padelofgodsbali.com",
}
