function formatUnit(value: number) {
  return Number(value.toFixed(1)).toString()
}

export function formatPlayCount(value: number): string {
  const count = Number.isFinite(value) ? Math.max(0, value) : 0
  if (count >= 100_000_000) return `${formatUnit(count / 100_000_000)} 亿`
  if (count >= 10_000) return `${formatUnit(count / 10_000)} 万`
  return new Intl.NumberFormat('zh-CN').format(count)
}
