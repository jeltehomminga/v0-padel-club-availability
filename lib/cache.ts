interface CacheEntry {
  data: any
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class ServerCache {
  private cache = new Map<string, CacheEntry>()

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const serverCache = new ServerCache()
