export interface AudioAdapter {
  src: string
  volume: number
  readonly paused: boolean
  play(): Promise<void>
  pause(): void
  on(event: 'ended' | 'error', listener: () => void): () => void
}

export interface AudioElementLike {
  src: string
  volume: number
  paused: boolean
  play(): Promise<void>
  pause(): void
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

export function createAudioAdapter(element?: AudioElementLike): AudioAdapter {
  const audio = element ?? new Audio()
  return {
    get src() {
      return audio.src
    },
    set src(value: string) {
      audio.src = value
    },
    get volume() {
      return audio.volume
    },
    set volume(value: number) {
      audio.volume = value
    },
    get paused() {
      return audio.paused
    },
    play: () => audio.play(),
    pause: () => audio.pause(),
    on(event, listener) {
      const wrapped: EventListener = () => listener()
      audio.addEventListener(event, wrapped)
      return () => audio.removeEventListener(event, wrapped)
    },
  }
}
