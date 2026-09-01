export const THEME_STORAGE_KEY = 'THEME'

export type ThemeMode = 'light' | 'dark'

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

export function readTheme(
  storage: Storage | undefined = browserStorage(),
): ThemeMode {
  const stored = storage?.getItem(THEME_STORAGE_KEY)
  return isThemeMode(stored) ? stored : 'light'
}

export function saveTheme(
  mode: ThemeMode,
  storage: Storage | undefined = browserStorage(),
): ThemeMode {
  storage?.setItem(THEME_STORAGE_KEY, mode)
  return mode
}
