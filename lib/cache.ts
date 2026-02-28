type CacheEntry<T = unknown> = {
  data: T
  timestamp: number
  ttl: number
}

const defaultTtl = 5 * 60 * 1000 // 5 minutes

class ServerCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry || Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  /** @param ttl TTL in milliseconds. Defaults to 5 minutes. */
  set<T>(key: string, data: T, ttl = defaultTtl): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const serverCache = new ServerCache()
