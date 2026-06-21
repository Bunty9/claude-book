import { ChapterMeta, TRACKS, TrackId } from './types'

export const tracks: readonly TrackId[] = TRACKS

export const chapters: ChapterMeta[] = [
  {
    id: 'what-is-an-llm',
    title: 'What is an LLM, fundamentally?',
    part: 'P0',
    tracks: { beginner: 1, engineer: 1, automator: 1 },
    difficulty: 1,
    estMinutes: 12,
    tags: ['fundamentals', 'llm', 'tokens'],
    summary: 'Tokens, next-token prediction, context, and why models hallucinate — the mental model everything else builds on.',
  },
]

export function chapterById(id: string): ChapterMeta | undefined {
  return chapters.find(c => c.id === id)
}

export function chaptersForTrack(track: TrackId): ChapterMeta[] {
  return chapters
    .filter(c => c.tracks[track] !== undefined)
    .sort((a, b) => (a.tracks[track] ?? 0) - (b.tracks[track] ?? 0))
}
