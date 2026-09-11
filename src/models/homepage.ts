export interface DragonBall {
  id: number
  name: string
  iconUrl: string
  url: string
}

export interface HotTopic {
  id: number
  name: string
  picUrl: string
  participateCount: number
}

export interface CalendarEvent {
  id: number
  title: string
  picUrl: string
  resourceId: number
  resourceType: number | string
}
