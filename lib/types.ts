/**
 * Raw response types from the Playtomic API (api.playtomic.io/v1).
 * Used for type-safe parsing of API responses.
 */

export type PlaytomicApiTenant = {
  tenant_id?: string
  id?: string
  name?: string
  tenant_name?: string
  address?: {
    coordinate?: { lat: number; lon: number }
  }
  coordinate?: { lat: number; lon: number }
}

export type PlaytomicApiSlot = {
  start_time: string
  duration: number
  price: string | number
}

export type PlaytomicApiAvailabilityItem = {
  resource_id: string
  start_date: string
  slots?: PlaytomicApiSlot[]
}
