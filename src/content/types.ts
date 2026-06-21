export const TRACKS = ['beginner', 'engineer', 'automator'] as const
export type TrackId = (typeof TRACKS)[number]

export type PartId = 'P0'|'P1'|'P2'|'P3'|'P4'|'P5'|'P6'|'P7'|'P8'|'P9'|'P10'

export interface ChapterMeta {
  id: string            // stable slug, unique
  title: string
  part: PartId
  tracks: Partial<Record<TrackId, number>>  // 1-based order within each track it belongs to
  difficulty: 1|2|3|4|5
  estMinutes: number
  tags: string[]
  summary: string
}
