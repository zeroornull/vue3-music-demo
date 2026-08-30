import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration } from '@/utils/number'

describe('formatClock', () => {
  it('formats finite seconds as mm:ss', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(65.9)).toBe('01:05')
    expect(formatClock(600)).toBe('10:00')
  })

  it('treats non-finite and negative values as zero', () => {
    expect(formatClock(Number.NaN)).toBe('00:00')
    expect(formatClock(Number.POSITIVE_INFINITY)).toBe('00:00')
    expect(formatClock(-12)).toBe('00:00')
  })
})

describe('formatDuration', () => {
  it('formats milliseconds through the same clock', () => {
    expect(formatDuration(65_900)).toBe('01:05')
    expect(formatDuration(Number.NaN)).toBe('00:00')
  })
})
