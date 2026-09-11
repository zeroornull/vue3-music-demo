export interface TopicDetail {
  id: number
  name: string
  coverUrl: string
  desc: string
  participateCount: number
}

export interface TopicEvent {
  id: number
  userName: string
  content: string
  picUrl: string
}

export interface HotwallComment {
  id: number
  content: string
  nickname: string
  likedCount: number
}
