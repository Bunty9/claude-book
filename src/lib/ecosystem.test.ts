import { describe, it, expect } from 'vitest'
import {
  ECOSYSTEM_ITEMS,
  filterItems,
  typeLabel,
  useCaseLabel,
  typeBadgeClasses,
  DEFAULT_FILTERS,
  type EcosystemFilters,
  type ItemType,
} from './ecosystem'

// ── Data integrity ────────────────────────────────────────────────────────────

describe('ECOSYSTEM_ITEMS data integrity', () => {
  it('has at least 30 items', () => {
    expect(ECOSYSTEM_ITEMS.length).toBeGreaterThanOrEqual(30)
  })

  it('every item has a unique id', () => {
    const ids = ECOSYSTEM_ITEMS.map(i => i.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('every item has a non-empty name and description', () => {
    for (const item of ECOSYSTEM_ITEMS) {
      expect(item.name.trim().length).toBeGreaterThan(0)
      expect(item.description.trim().length).toBeGreaterThan(0)
    }
  })

  it('every item has at least one use case', () => {
    for (const item of ECOSYSTEM_ITEMS) {
      expect(item.useCases.length).toBeGreaterThan(0)
    }
  })

  it('every item has a valid url', () => {
    for (const item of ECOSYSTEM_ITEMS) {
      expect(item.url).toMatch(/^https?:\/\//)
    }
  })

  it('contains at least one item of each type', () => {
    const types = new Set(ECOSYSTEM_ITEMS.map(i => i.type))
    expect(types.has('plugin')).toBe(true)
    expect(types.has('mcp-server')).toBe(true)
    expect(types.has('skill')).toBe(true)
    expect(types.has('repo')).toBe(true)
  })

  it('has items flagged as new (isNew=true)', () => {
    const newItems = ECOSYSTEM_ITEMS.filter(i => i.isNew)
    expect(newItems.length).toBeGreaterThanOrEqual(3)
  })

  it('security-guidance plugin is flagged as new', () => {
    const item = ECOSYSTEM_ITEMS.find(i => i.id === 'plugin-security-guidance')
    expect(item).toBeDefined()
    expect(item?.isNew).toBe(true)
  })

  it('repomix mcp server is flagged as new', () => {
    const item = ECOSYSTEM_ITEMS.find(i => i.id === 'mcp-repomix')
    expect(item).toBeDefined()
    expect(item?.isNew).toBe(true)
  })
})

// ── filterItems ───────────────────────────────────────────────────────────────

describe('filterItems', () => {
  it('returns all items with default filters', () => {
    const result = filterItems(ECOSYSTEM_ITEMS, DEFAULT_FILTERS)
    expect(result.length).toBe(ECOSYSTEM_ITEMS.length)
  })

  it('filters by type=plugin', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, type: 'plugin' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      expect(item.type).toBe('plugin')
    }
  })

  it('filters by type=mcp-server', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, type: 'mcp-server' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      expect(item.type).toBe('mcp-server')
    }
  })

  it('filters by type=skill', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, type: 'skill' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      expect(item.type).toBe('skill')
    }
  })

  it('filters by type=repo', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, type: 'repo' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      expect(item.type).toBe('repo')
    }
  })

  it('filters by useCase=security', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, useCase: 'security' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      expect(item.useCases).toContain('security')
    }
  })

  it('filters by useCase=source-control', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, useCase: 'source-control' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      expect(item.useCases).toContain('source-control')
    }
  })

  it('combines type + useCase filters (intersection)', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, type: 'plugin', useCase: 'source-control' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      expect(item.type).toBe('plugin')
      expect(item.useCases).toContain('source-control')
    }
  })

  it('filters by newOnly=true', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, newOnly: true }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      expect(item.isNew).toBe(true)
    }
  })

  it('text query matches name (case insensitive)', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, query: 'REPOMIX' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      const text = `${item.name} ${item.description}`.toLowerCase()
      expect(text).toContain('repomix')
    }
  })

  it('text query matches description substring', () => {
    // "vulnerabilities" appears in security-guidance plugin description
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, query: 'session' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns empty array when query matches nothing', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, query: 'zzzznonexistent9999' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBe(0)
  })

  it('trims whitespace in query', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, query: '  security  ' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(result.length).toBeGreaterThan(0)
  })

  it('newOnly + type combo narrows correctly', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, newOnly: true, type: 'repo' }
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    for (const item of result) {
      expect(item.isNew).toBe(true)
      expect(item.type).toBe('repo')
    }
  })

  it('does not mutate the source array', () => {
    const original = [...ECOSYSTEM_ITEMS]
    filterItems(ECOSYSTEM_ITEMS, { ...DEFAULT_FILTERS, type: 'plugin' })
    expect(ECOSYSTEM_ITEMS).toEqual(original)
  })

  it('is deterministic — same input always same output order', () => {
    const filters: EcosystemFilters = { ...DEFAULT_FILTERS, type: 'plugin' }
    const r1 = filterItems(ECOSYSTEM_ITEMS, filters)
    const r2 = filterItems(ECOSYSTEM_ITEMS, filters)
    expect(r1.map(i => i.id)).toEqual(r2.map(i => i.id))
  })

  it('sorts new items before non-new items', () => {
    const filters: EcosystemFilters = DEFAULT_FILTERS
    const result = filterItems(ECOSYSTEM_ITEMS, filters)
    let seenNonNew = false
    for (const item of result) {
      if (!item.isNew) seenNonNew = true
      if (seenNonNew) {
        expect(item.isNew).toBe(false)
      }
    }
  })

  it('within same isNew group, items are sorted alphabetically by name', () => {
    const result = filterItems(ECOSYSTEM_ITEMS, DEFAULT_FILTERS)
    const newItems = result.filter(i => i.isNew)
    const nonNewItems = result.filter(i => !i.isNew)
    for (const group of [newItems, nonNewItems]) {
      for (let idx = 1; idx < group.length; idx++) {
        const prev = group[idx - 1]
        const curr = group[idx]
        if (prev !== undefined && curr !== undefined) {
          expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0)
        }
      }
    }
  })
})

// ── Label helpers ─────────────────────────────────────────────────────────────

describe('typeLabel', () => {
  it('returns "All types" for all', () => {
    expect(typeLabel('all')).toBe('All types')
  })
  it('returns readable label for each type', () => {
    expect(typeLabel('plugin')).toBe('Plugin')
    expect(typeLabel('mcp-server')).toBe('MCP Server')
    expect(typeLabel('skill')).toBe('Skill')
    expect(typeLabel('repo')).toBe('Repository')
  })
})

describe('useCaseLabel', () => {
  it('returns "All use cases" for all', () => {
    expect(useCaseLabel('all')).toBe('All use cases')
  })
  it('returns human-readable label for code-intelligence', () => {
    expect(useCaseLabel('code-intelligence')).toBe('Code Intelligence')
  })
  it('returns human-readable label for browser-automation', () => {
    expect(useCaseLabel('browser-automation')).toBe('Browser Automation')
  })
  it('returns human-readable label for context-management', () => {
    expect(useCaseLabel('context-management')).toBe('Context Management')
  })
})

// ── Badge classes ─────────────────────────────────────────────────────────────

describe('typeBadgeClasses', () => {
  const types: ItemType[] = ['plugin', 'mcp-server', 'skill', 'repo']

  it('returns a non-empty string for every type', () => {
    for (const t of types) {
      const cls = typeBadgeClasses(t)
      expect(cls.trim().length).toBeGreaterThan(0)
    }
  })

  it('each type returns a distinct class string', () => {
    const classes = types.map(typeBadgeClasses)
    const unique = new Set(classes)
    expect(unique.size).toBe(types.length)
  })

  it('plugin badge uses accent token classes', () => {
    expect(typeBadgeClasses('plugin')).toContain('accent')
  })

  it('mcp-server badge uses note token classes', () => {
    expect(typeBadgeClasses('mcp-server')).toContain('note')
  })

  it('skill badge uses tip token classes', () => {
    expect(typeBadgeClasses('skill')).toContain('tip')
  })

  it('repo badge uses warning token classes', () => {
    expect(typeBadgeClasses('repo')).toContain('warning')
  })
})
