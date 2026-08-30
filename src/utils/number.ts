function formatUnit(value: number) {
  return Number(value.toFixed(1)).toString()
}

export function formatPlayCount(value: number): string {
  const count = Number.isFinite(value) ? Math.max(0, value) : 0
  if (count >= 100_000_000) return `${formatUnit(count / 100_000_000)} 亿`
  if (count >= 10_000) return `${formatUnit(count / 10_000)} 万`
  return new Intl.NumberFormat('zh-CN').format(count)
}

export function formatClock(seconds: number): string {
  const totalSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  const minutes = Math.floor(totalSeconds / 60)
  const remainder = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`
}

export function formatDuration(milliseconds: number): string {
  return formatClock(milliseconds / 1000)
}

export function formatPublishDate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
  }).formatToParts(new Date(value))
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  if (!year || !month || !day) return ''
  return `${year}/${month}/${day}`
}
