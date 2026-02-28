interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

class ServerCache {
  private cache = new Map<string, CacheEntry>()

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  /** @param ttl TTL in milliseconds. Defaults to 5 minutes. */
  set<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const serverCache = new ServerCache()
