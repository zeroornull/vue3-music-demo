import { http, type HttpClient } from '@/api/http'
import type { DjProgram, DjProgramDetail } from '@/models/dj'
import { normalizeSong, type NetworkSong } from '@/models/song'

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

function readDjProgram(value: unknown): DjProgram | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  return {
    id: value.id,
    name: value.name,
    copywriter: typeof value.copywriter === 'string' ? value.copywriter : '',
    picUrl: typeof value.picUrl === 'string' ? value.picUrl : '',
  }
}

export async function getPersonalizedDjPrograms(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgram[]> {
  const response = await client.get<{ result?: unknown }>('/personalized/djprogram')
  if (!Array.isArray(response.result)) {
    throw new Error('推荐电台响应格式不正确')
  }
  return response.result
    .map(readDjProgram)
    .filter((item): item is DjProgram => item !== null)
}

export async function getDjProgramDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgramDetail> {
  const response = await client.get<{ program?: unknown }>('/dj/program/detail', {
    id,
  })
  const raw = isRecord(response.program) ? response.program : null
  if (!raw || typeof raw.id !== 'number' || typeof raw.name !== 'string') {
    throw new Error('电台节目不存在')
  }

  const radio = isRecord(raw.radio) ? raw.radio : null
  const dj = isRecord(raw.dj) ? raw.dj : null
  const radioDj = radio && isRecord(radio.dj) ? radio.dj : null
  const cover =
    typeof raw.coverUrl === 'string' && raw.coverUrl
      ? raw.coverUrl
      : typeof raw.blurCoverUrl === 'string' && raw.blurCoverUrl
        ? raw.blurCoverUrl
        : radio && typeof radio.picUrl === 'string'
          ? radio.picUrl
          : ''
  const song = isNetworkSong(raw.mainSong) ? normalizeSong(raw.mainSong) : null

  return {
    id: raw.id,
    name: raw.name,
    description: typeof raw.description === 'string' ? raw.description : '',
    coverUrl: cover,
    radioName: radio && typeof radio.name === 'string' ? radio.name : '',
    djName:
      dj && typeof dj.nickname === 'string' && dj.nickname
        ? dj.nickname
        : radioDj && typeof radioDj.nickname === 'string'
          ? radioDj.nickname
          : '',
    listenerCount: typeof raw.listenerCount === 'number' ? raw.listenerCount : 0,
    duration:
      typeof raw.duration === 'number'
        ? raw.duration
        : song?.duration ?? 0,
    song,
  }
}
