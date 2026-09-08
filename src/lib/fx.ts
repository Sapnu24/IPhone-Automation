// Approximate offline reference rates, per 1 USD. Rough — for quick estimates
// only, no live data. Users can eyeball and adjust.
export const USD_RATES: Record<string, number> = {
  USD: 1,
  PHP: 58,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150,
  INR: 83,
  AUD: 1.5,
  CAD: 1.36,
  SGD: 1.34,
  AED: 3.67,
  MXN: 18,
  BRL: 5,
  ZAR: 18,
  NGN: 1500,
  IDR: 15800,
}

export const FX_CODES = Object.keys(USD_RATES)

export function convert(amount: number, from: string, to: string): number | null {
  const rf = USD_RATES[from]
  const rt = USD_RATES[to]
  if (!rf || !rt) return null
  return (amount * rt) / rf
}
