export type CategorySort = 'hq' | 'hot' | 'new'

export interface CategoryTag {
  id: number
  name: string
}

export function mergeCategoryTags(
  hot: CategoryTag[],
  catlist: CategoryTag[],
  fallback: CategoryTag[],
): CategoryTag[] {
  const base = catlist.length ? catlist : fallback
  const names = new Set<string>()
  const tags: CategoryTag[] = []
  for (const tag of [...hot, ...base]) {
    const name = tag.name.trim()
    if (!name || name === '全部' || names.has(name)) continue
    names.add(name)
    tags.push({ ...tag, name })
  }
  return tags
}

export interface CategoryPlaylistCreator {
  nickname: string
}

export interface CategoryPlaylist {
  id: number
  name: string
  coverImgUrl: string
  playCount: number
  creator: CategoryPlaylistCreator
}

export interface CategoryPlaylistPage {
  playlists: CategoryPlaylist[]
  more: boolean
  lasttime: number
}
