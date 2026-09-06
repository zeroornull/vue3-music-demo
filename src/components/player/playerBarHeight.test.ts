// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'

import {
  PLAYER_BAR_HEIGHT_VAR,
  setPlayerBarHeight,
} from '@/components/player/playerBarHeight'

describe('playerBarHeight', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty(PLAYER_BAR_HEIGHT_VAR)
  })

  it('writes a positive height onto the document element', () => {
    setPlayerBarHeight(88)
    expect(document.documentElement.style.getPropertyValue(PLAYER_BAR_HEIGHT_VAR)).toBe(
      '88px',
    )
  })

  it('clears the variable for a non-positive height', () => {
    setPlayerBarHeight(88)
    setPlayerBarHeight(0)
    expect(document.documentElement.style.getPropertyValue(PLAYER_BAR_HEIGHT_VAR)).toBe(
      '',
    )
  })
})
