export interface MediaComment {
  commentId: number
  content: string
  nickname: string
  replyCount?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseMediaComment(value: unknown): MediaComment | null {
  if (
    !isRecord(value) ||
    typeof value.commentId !== 'number' ||
    !Number.isInteger(value.commentId) ||
    value.commentId <= 0
  ) {
    return null
  }
  const content = typeof value.content === 'string' ? value.content.trim() : ''
  if (!content) return null
  const user = isRecord(value.user) ? value.user : {}
  const nickname =
    typeof user.nickname === 'string' ? user.nickname.trim() : ''
  const replyCount =
    typeof value.replyCount === 'number' &&
    Number.isInteger(value.replyCount) &&
    value.replyCount > 0
      ? value.replyCount
      : 0
  return {
    commentId: value.commentId,
    content,
    nickname: nickname || '匿名',
    ...(replyCount > 0 ? { replyCount } : {}),
  }
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
