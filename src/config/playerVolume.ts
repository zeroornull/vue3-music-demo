export const PLAYER_VOLUME_STORAGE_KEY = 'PLAYER-VOLUME'

const DEFAULT_VOLUME = 1

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function clampVolume(value: number): number {
  const raw = Number(value)
  return Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0
}

function parseStoredPercent(raw: string | null | undefined): number | null {
  if (raw == null) return null
  const value = raw.trim()
  if (!/^\d+$/.test(value)) return null
  const percent = Number(value)
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) return null
  return percent / 100
}

export function readPlayerVolume(
  storage: Storage | undefined = browserStorage(),
): number {
  return parseStoredPercent(storage?.getItem(PLAYER_VOLUME_STORAGE_KEY)) ?? DEFAULT_VOLUME
}

export function savePlayerVolume(
  value: number,
  storage: Storage | undefined = browserStorage(),
): number {
  const next = clampVolume(value)
  storage?.setItem(PLAYER_VOLUME_STORAGE_KEY, String(Math.round(next * 100)))
  return next
}
