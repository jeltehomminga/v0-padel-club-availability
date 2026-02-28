export const BALI_TZ = "Asia/Makassar"

/**
 * Bali is UTC+8. Converts UTC time string (HH:MM:SS) to Bali local time.
 */
export const convertToBaliTime = (utcTime: string): string => {
  if (!utcTime) return utcTime
  const [h, m, s] = utcTime.split(":").map(Number)
  if (Number.isNaN(h)) return utcTime
  const baliHour = (h + 8) % 24
  return `${String(baliHour).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s ?? 0).padStart(2, "0")}`
}

export const getDateString = (offset = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toLocaleDateString("sv-SE", { timeZone: BALI_TZ })
}

export const getNext14Days = (): string[] =>
  Array.from({ length: 14 }, (_, index) => getDateString(index))
