export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? '+' : ''
  return sign + formatCurrency(value)
}

export function calculateGain(capital: number, performancePercent: number): number {
  return capital * (performancePercent / 100)
}

export function calculatePerformance(totalDeposited: number, currentCapital: number): number {
  if (totalDeposited === 0) return 0
  return ((currentCapital - totalDeposited) / totalDeposited) * 100
}
