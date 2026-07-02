import { getUSDINR } from "./exchange-rate"

export function getCommissionRate(dealValue: number): number {
  if (dealValue <= 100000) return 20
  if (dealValue <= 500000) return 15
  return 10
}

export async function calculateCommission(
  paymentAmount: number,
  dealValue: number,
  currency: string,
): Promise<{
  rate: number
  amount: number
  exchangeRate?: number
}> {
  if (currency === "USD") {
    const rate = await getUSDINR()
    const dealValueINR = dealValue * rate
    const commissionRate = getCommissionRate(dealValueINR)
    return { rate: commissionRate, amount: Math.round(paymentAmount * commissionRate) / 100, exchangeRate: rate }
  }

  const commissionRate = getCommissionRate(dealValue)
  return { rate: commissionRate, amount: Math.round(paymentAmount * commissionRate) / 100 }
}
