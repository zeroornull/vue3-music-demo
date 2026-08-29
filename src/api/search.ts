import { http, type HttpClient } from '@/api/http'
import type { SearchHot } from '@/models/search'
import { normalizeSong, type NetworkSong, type Song } from '@/models/song'

export const SEARCH_SONG_LIMIT = 10
export const SEARCH_HOT_LIMIT = 10

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNetworkSong(value: unknown): value is NetworkSong {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string'
  )
}

function readHot(value: unknown): SearchHot | null {
  if (!isRecord(value) || typeof value.searchWord !== 'string' || !value.searchWord) {
    return null
  }
  return {
    searchWord: value.searchWord,
    score: typeof value.score === 'number' ? value.score : 0,
    content: typeof value.content === 'string' ? value.content : '',
  }
}

export async function getSearchHotDetail(
  client: Pick<HttpClient, 'get'> = http,
): Promise<SearchHot[]> {
  const response = await client.get<{ data?: unknown }>('/search/hot/detail')
  if (!Array.isArray(response.data)) {
    throw new Error('热门搜索响应格式不正确')
  }
  return response.data
    .map(readHot)
    .filter((item): item is SearchHot => item !== null)
    .slice(0, SEARCH_HOT_LIMIT)
}

export async function getSearchSuggestSongs(
  keywords: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<Song[]> {
  const response = await client.get<{ result?: unknown }>('/search/suggest', {
    keywords,
  })
  const result = isRecord(response.result) ? response.result : null
  if (!result) {
    throw new Error('搜索建议响应格式不正确')
  }
  const songs = Array.isArray(result.songs) ? result.songs : []
  return songs
    .filter(isNetworkSong)
    .map(normalizeSong)
    .slice(0, SEARCH_SONG_LIMIT)
}
