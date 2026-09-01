import { describe, expect, it } from 'vitest'

import { normalizeSong } from '@/models/song'

const base = {
  id: 301,
  name: '晚风来信',
  ar: [{ id: 401, name: '林间电台' }],
  al: { id: 501, name: '晚风来信' },
}

describe('normalizeSong', () => {
  it('keeps a positive integer mv id', () => {
    expect(normalizeSong({ ...base, mv: 701 })).toMatchObject({
      id: 301,
      mv: 701,
    })
    expect(normalizeSong({ ...base, mvid: 702 })).toMatchObject({
      id: 301,
      mv: 702,
    })
  })

  it('omits missing, zero, fractional and non-integer mv values', () => {
    expect(normalizeSong(base).mv).toBeUndefined()
    expect(normalizeSong({ ...base, mv: 0 }).mv).toBeUndefined()
    expect(normalizeSong({ ...base, mv: -3 }).mv).toBeUndefined()
    expect(normalizeSong({ ...base, mv: 1.5 }).mv).toBeUndefined()
    expect(normalizeSong({ ...base, mv: Number.NaN }).mv).toBeUndefined()
    expect(
      normalizeSong({ ...base, mv: '701' as unknown as number }).mv,
    ).toBeUndefined()
  })
})
