export interface LyricLine {
  time: number | null
  text: string
  translation?: string
  romanization?: string
}

export interface LyricDoc {
  lines: LyricLine[]
}

const METADATA = /^\[(ti|ar|al|by|offset):/i
const STAMP = /^\[(\d{1,3}):(\d{1,2})(?:\.(\d{1,3}))?\]/

export function parseLyric(raw: string): LyricLine[] {
  const lines: LyricLine[] = []
  for (const original of raw.replace(/\r/g, '').split('\n')) {
    const line = original.trim()
    if (!line || METADATA.test(line)) continue
    const times: number[] = []
    let rest = line
    while (true) {
      const match = STAMP.exec(rest)
      if (!match) break
      const fraction = match[3]
        ? Number(match[3].padEnd(3, '0').slice(0, 3)) / 1000
        : 0
      times.push(Number(match[1]) * 60 + Number(match[2]) + fraction)
      rest = rest.slice(match[0].length)
    }
    const text = rest.trim()
    if (!text) continue
    if (!times.length) {
      lines.push({ text, time: null })
      continue
    }
    for (const time of times) lines.push({ text, time })
  }
  lines.sort(
    (left, right) =>
      (left.time ?? Number.POSITIVE_INFINITY) -
      (right.time ?? Number.POSITIVE_INFINITY),
  )
  return lines
}

function attachByTime(
  lines: LyricLine[],
  extras: LyricLine[],
  field: 'translation' | 'romanization',
): LyricLine[] {
  const byTime = new Map<number, string>()
  for (const line of extras) {
    if (line.time == null || !line.text) continue
    byTime.set(line.time, line.text)
  }
  return lines.map((line) => {
    if (line.time == null) return line
    const value = byTime.get(line.time)
    return value ? { ...line, [field]: value } : line
  })
}

export function attachTranslations(
  lines: LyricLine[],
  translated: LyricLine[],
): LyricLine[] {
  return attachByTime(lines, translated, 'translation')
}

export function attachRomanizations(
  lines: LyricLine[],
  romanized: LyricLine[],
): LyricLine[] {
  return attachByTime(lines, romanized, 'romanization')
}
