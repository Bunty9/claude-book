import { describe, it, expect } from 'vitest'
import {
  TOOL_CATALOG,
  filterTools,
  availableSurfaces,
  type ToolEntry,
  type FilterParams,
} from './toolCatalog'

// ── Catalog shape ────────────────────────────────────────────────────────────

describe('TOOL_CATALOG', () => {
  it('contains at least 30 entries', () => {
    expect(TOOL_CATALOG.length).toBeGreaterThanOrEqual(30)
  })

  it('every entry has non-empty required string fields', () => {
    for (const tool of TOOL_CATALOG) {
      expect(tool.name.trim().length, `name empty on ${tool.name}`).toBeGreaterThan(0)
      expect(tool.what.trim().length, `what empty on ${tool.name}`).toBeGreaterThan(0)
      expect(tool.when.trim().length, `when empty on ${tool.name}`).toBeGreaterThan(0)
      expect(tool.example.trim().length, `example empty on ${tool.name}`).toBeGreaterThan(0)
      expect(tool.gotcha.trim().length, `gotcha empty on ${tool.name}`).toBeGreaterThan(0)
    }
  })

  it('permissionRequired is a boolean for every entry', () => {
    for (const tool of TOOL_CATALOG) {
      expect(typeof tool.permissionRequired, `permissionRequired type on ${tool.name}`).toBe('boolean')
    }
  })

  it('names are unique', () => {
    const names = TOOL_CATALOG.map(t => t.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('known permission-required tools are marked correctly', () => {
    const permTools = ['Bash', 'Edit', 'Write', 'WebFetch', 'WebSearch', 'Monitor', 'NotebookEdit', 'Artifact']
    for (const name of permTools) {
      const tool = TOOL_CATALOG.find(t => t.name === name)
      expect(tool, `${name} not found`).toBeDefined()
      expect(tool?.permissionRequired, `${name} should require permission`).toBe(true)
    }
  })

  it('known no-permission tools are marked correctly', () => {
    const noPermTools = ['Read', 'Glob', 'Grep', 'LSP', 'TaskCreate', 'CronCreate', 'PushNotification', 'ToolSearch']
    for (const name of noPermTools) {
      const tool = TOOL_CATALOG.find(t => t.name === name)
      expect(tool, `${name} not found`).toBeDefined()
      expect(tool?.permissionRequired, `${name} should NOT require permission`).toBe(false)
    }
  })

  it('all surfaces are from the allowed set', () => {
    const allowed = new Set<string>([
      'filesystem', 'shell', 'search', 'web', 'agents',
      'tasks', 'mcp', 'scheduling', 'notifications', 'notebook',
      'intelligence', 'platform',
    ])
    for (const tool of TOOL_CATALOG) {
      expect(allowed.has(tool.surface), `unexpected surface "${tool.surface}" on ${tool.name}`).toBe(true)
    }
  })
})

// ── filterTools ──────────────────────────────────────────────────────────────

const baseParams = (): FilterParams => ({
  query: '',
  surface: 'all',
  permissionRequired: null,
})

describe('filterTools', () => {
  it('returns all entries when params are empty', () => {
    const result = filterTools(TOOL_CATALOG, baseParams())
    expect(result.length).toBe(TOOL_CATALOG.length)
  })

  it('does not mutate the original catalog', () => {
    const original = [...TOOL_CATALOG]
    filterTools(TOOL_CATALOG, { query: 'bash', surface: 'all', permissionRequired: null })
    expect(TOOL_CATALOG).toEqual(original)
  })

  it('filters by exact surface', () => {
    const result = filterTools(TOOL_CATALOG, { ...baseParams(), surface: 'shell' })
    expect(result.every(t => t.surface === 'shell')).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('filters by permission required = true', () => {
    const result = filterTools(TOOL_CATALOG, { ...baseParams(), permissionRequired: true })
    expect(result.every(t => t.permissionRequired === true)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('filters by permission required = false', () => {
    const result = filterTools(TOOL_CATALOG, { ...baseParams(), permissionRequired: false })
    expect(result.every(t => t.permissionRequired === false)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('text query matches tool name (case-insensitive)', () => {
    const result = filterTools(TOOL_CATALOG, { ...baseParams(), query: 'BASH' })
    expect(result.some(t => t.name === 'Bash')).toBe(true)
  })

  it('text query matches content in what field', () => {
    const result = filterTools(TOOL_CATALOG, { ...baseParams(), query: 'ripgrep' })
    expect(result.some(t => t.name === 'Grep')).toBe(true)
  })

  it('text query matches content in gotcha field', () => {
    const result = filterTools(TOOL_CATALOG, { ...baseParams(), query: 'gitignore' })
    // Both Glob (does NOT respect) and Grep (does respect) mention gitignore
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('empty query after trim returns all entries', () => {
    const result = filterTools(TOOL_CATALOG, { ...baseParams(), query: '   ' })
    expect(result.length).toBe(TOOL_CATALOG.length)
  })

  it('query with no matches returns empty array', () => {
    const result = filterTools(TOOL_CATALOG, { ...baseParams(), query: 'xyzzynonexistent9999' })
    expect(result).toHaveLength(0)
  })

  it('combined surface + query filter narrows results', () => {
    const shellResult = filterTools(TOOL_CATALOG, { query: 'background', surface: 'shell', permissionRequired: null })
    const allResult = filterTools(TOOL_CATALOG, { query: 'background', surface: 'all', permissionRequired: null })
    // Shell filter should be a subset of all
    expect(shellResult.length).toBeLessThanOrEqual(allResult.length)
    expect(shellResult.every(t => t.surface === 'shell')).toBe(true)
  })

  it('sorts by name (default) — result is alphabetically ordered', () => {
    const result = filterTools(TOOL_CATALOG, baseParams(), 'name')
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].name.localeCompare(result[i].name)).toBeLessThanOrEqual(0)
    }
  })

  it('sorts by surface — groups tools by surface then name within group', () => {
    const result = filterTools(TOOL_CATALOG, baseParams(), 'surface')
    for (let i = 1; i < result.length; i++) {
      const cmp = result[i - 1].surface.localeCompare(result[i].surface)
      if (cmp === 0) {
        // Same surface → name must be non-decreasing
        expect(result[i - 1].name.localeCompare(result[i].name)).toBeLessThanOrEqual(0)
      } else {
        // Surface must be non-decreasing
        expect(cmp).toBeLessThanOrEqual(0)
      }
    }
  })

  it('works on an empty catalog', () => {
    const result = filterTools([], baseParams())
    expect(result).toHaveLength(0)
  })

  it('works on a single-entry catalog', () => {
    const single: ToolEntry[] = [TOOL_CATALOG[0]]
    const result = filterTools(single, baseParams())
    expect(result).toHaveLength(1)
  })
})

// ── availableSurfaces ────────────────────────────────────────────────────────

describe('availableSurfaces', () => {
  it('returns unique surfaces only', () => {
    const surfaces = availableSurfaces(TOOL_CATALOG)
    const unique = new Set(surfaces)
    expect(unique.size).toBe(surfaces.length)
  })

  it('is sorted alphabetically', () => {
    const surfaces = availableSurfaces(TOOL_CATALOG)
    for (let i = 1; i < surfaces.length; i++) {
      expect(surfaces[i - 1].localeCompare(surfaces[i])).toBeLessThanOrEqual(0)
    }
  })

  it('returns empty array for empty catalog', () => {
    expect(availableSurfaces([])).toHaveLength(0)
  })

  it('includes expected surfaces from the full catalog', () => {
    const surfaces = availableSurfaces(TOOL_CATALOG)
    const expected: string[] = ['agents', 'filesystem', 'mcp', 'notifications', 'platform', 'scheduling', 'shell', 'tasks', 'web']
    for (const s of expected) {
      expect(surfaces).toContain(s)
    }
  })
})
