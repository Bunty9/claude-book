import MiniSearch from 'minisearch'

export interface SearchDoc {
  id: string
  title: string
  summary: string
  body: string
  part: string
}

export interface SearchHit {
  id: string
  title: string
  summary: string
  part: string
  score: number
}

export function buildIndex(docs: SearchDoc[]): MiniSearch {
  const index = new MiniSearch<SearchDoc>({
    fields: ['title', 'summary', 'body'],
    storeFields: ['title', 'summary', 'part'],
  })
  index.addAll(docs)
  return index
}

export function search(index: MiniSearch, query: string): SearchHit[] {
  const results = index.search(query, {
    prefix: true,
    fuzzy: 0.2,
    boost: { title: 2, summary: 1.5 },
  })
  return results.map(r => ({
    id: String(r.id),
    title: String(r.title),
    summary: String(r.summary),
    part: String(r.part),
    score: r.score,
  }))
}
