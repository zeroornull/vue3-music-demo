import { http, type HttpClient } from '@/api/http'
import type { Song, SongArtist, SongAlbum, SongUrl } from '@/models/song'

interface SongUrlResponse {
  data?: SongUrl[]
}

interface NetworkAlbum {
  id: number
  name: string
  picUrl?: string
}

interface NetworkSong {
  id: number
  name: string
  ar?: SongArtist[]
  al?: NetworkAlbum
  artists?: SongArtist[]
  album?: SongAlbum
  picUrl?: string
}

interface SongDetailResponse {
  songs?: NetworkSong[]
}

export async function getSongUrl(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongUrl> {
  const response = await client.get<SongUrlResponse>('/song/url', { id })
  const item = response.data?.find((entry) => entry.id === id)
  if (!item || typeof item.url !== 'string' || !item.url.trim()) {
    throw new Error('歌曲暂无可播放地址')
  }
  return item
}

function normalizeSong(song: NetworkSong): Song {
  return {
    id: song.id,
    name: song.name,
    artists: song.artists ?? song.ar ?? [],
    album:
      song.album ??
      (song.al
        ? {
            id: song.al.id,
            name: song.al.name,
            picUrl: song.al.picUrl,
          }
        : undefined),
    picUrl: song.picUrl ?? song.al?.picUrl,
  }
}

export async function getSongDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<Song> {
  const response = await client.get<SongDetailResponse>('/song/detail', {
    ids: id,
  })
  const song = response.songs?.find((entry) => entry.id === id)
  if (!song) throw new Error('歌曲详情不存在')
  return normalizeSong(song)
}
