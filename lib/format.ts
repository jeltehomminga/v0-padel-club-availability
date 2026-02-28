export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatCourtName(name: string): string {
  if (/^[0-9a-f]{8}-/.test(name))
    return `Court ${name.slice(-8, -4).toUpperCase()}`
  return name.startsWith("Court") ? name : `Court ${name}`
}
