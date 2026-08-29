export interface SongArtist {
  id: number
  name: string
}

export interface SongAlbum {
  id: number
  name: string
  picUrl?: string
}

export interface Song {
  id: number
  name: string
  artists: SongArtist[]
  album?: SongAlbum
  picUrl?: string
  duration?: number
}

export interface NetworkSong {
  id: number
  name: string
  ar?: SongArtist[]
  al?: SongAlbum
  artists?: SongArtist[]
  album?: SongAlbum
  picUrl?: string
  dt?: number
  duration?: number
}

export function normalizeSong(song: NetworkSong): Song {
  const album = song.album ?? song.al
  const duration = song.duration ?? song.dt
  return {
    id: song.id,
    name: song.name,
    artists: song.artists ?? song.ar ?? [],
    album,
    picUrl: song.picUrl ?? album?.picUrl,
    ...(typeof duration === 'number' && Number.isFinite(duration)
      ? { duration }
      : {}),
  }
}

export interface SongUrl {
  id: number
  url: string
  size?: number
  br?: number
  time?: number
  level?: string
}
