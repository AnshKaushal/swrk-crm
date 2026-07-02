const FALLBACK_RATE = 85
const CACHE_TTL = 60 * 60 * 1000

let cachedRate: number | null = null
let lastFetched: number = 0

export async function getUSDINR(): Promise<number> {
  if (cachedRate !== null && Date.now() - lastFetched < CACHE_TTL) {
    return cachedRate
  }

  try {
    const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json", {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const rate = data?.usd?.inr
    if (typeof rate === "number" && rate > 0) {
      cachedRate = rate
      lastFetched = Date.now()
      return rate
    }
    throw new Error("Invalid response format")
  } catch {
    if (cachedRate !== null) return cachedRate
    return FALLBACK_RATE
  }
}
