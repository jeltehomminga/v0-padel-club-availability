interface CacheEntry<T> {
  data: T
  timestamp: number
}

class ServerCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    console.log(`[v0] Cache hit for key: ${key}`)
    return entry.data
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
    console.log(`[v0] Cache set for key: ${key}`)
  }

  clear(): void {
    this.cache.clear()
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export const serverCache = new ServerCache()
