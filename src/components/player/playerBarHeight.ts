export const PLAYER_BAR_HEIGHT_VAR = '--player-bar-height'

export function setPlayerBarHeight(px: number) {
  if (!Number.isFinite(px) || px <= 0) {
    document.documentElement.style.removeProperty(PLAYER_BAR_HEIGHT_VAR)
    return
  }
  document.documentElement.style.setProperty(
    PLAYER_BAR_HEIGHT_VAR,
    `${Math.round(px)}px`,
  )
}
