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
