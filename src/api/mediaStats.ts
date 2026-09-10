const COUNT_KEYS = [
  'bookedCount',
  'commentCount',
  'likedCount',
  'playCount',
  'playTime',
  'shareCount',
  'subCount',
  'subscribedCount',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasCountField(value: Record<string, unknown>): boolean {
  return COUNT_KEYS.some((key) => typeof value[key] === 'number')
}

export function readCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0
}

export function unwrapStatsRecord(
  response: unknown,
): Record<string, unknown> | null {
  if (!isRecord(response)) return null
  const nested = isRecord(response.data) ? response.data : null
  if (nested && hasCountField(nested)) return nested
  if (hasCountField(response)) return response
  return null
}
