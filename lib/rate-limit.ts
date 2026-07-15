export class RateLimiter {
  private cache: Map<string, { count: number; expiresAt: number }>

  constructor() {
    this.cache = new Map()
  }

  /**
   * Checks if a request should be rate-limited.
   * @param ip The IP address or identifier of the user
   * @param limit Max requests allowed
   * @param windowMs Time window in milliseconds
   * @returns true if allowed, false if limit exceeded
   */
  limit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const record = this.cache.get(ip)

    if (!record) {
      this.cache.set(ip, { count: 1, expiresAt: now + windowMs })
      return true
    }

    if (now > record.expiresAt) {
      // Window expired, reset counter
      this.cache.set(ip, { count: 1, expiresAt: now + windowMs })
      return true
    }

    if (record.count >= limit) {
      return false // Limit exceeded
    }

    // Increment counter
    record.count++
    return true
  }
}

// Global instance to persist across API calls in the same Vercel worker
export const rateLimiter = new RateLimiter()
