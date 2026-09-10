export interface MediaComment {
  commentId: number
  content: string
  nickname: string
}

export function excludeSeenComments(
  list: MediaComment[] | null,
  seen: MediaComment[] | null,
): MediaComment[] | null {
  if (list === null) return null
  if (!seen?.length) return list
  const ids = new Set(seen.map((item) => item.commentId))
  return list.filter((item) => !ids.has(item.commentId))
}
