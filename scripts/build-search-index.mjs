import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'src', 'content')
const OUT_FILE = join(ROOT, 'public', 'search-index.json')

/**
 * Recursively collect all .mdx files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function collectMdxFiles(dir) {
  /** @type {string[]} */
  const results = []
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return results
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...collectMdxFiles(full))
    } else if (entry.endsWith('.mdx')) {
      results.push(full)
    }
  }
  return results
}

/**
 * Strip MDX/markdown markup from a string to get plain text.
 * Removes: import/export lines, JSX tags, code fences, headings/bold/italic symbols.
 * @param {string} raw
 * @returns {string}
 */
function stripMdx(raw) {
  return raw
    // remove import and export lines
    .replace(/^(import|export)\s+.*$/gm, '')
    // remove code fences (``` blocks)
    .replace(/```[\s\S]*?```/g, '')
    // remove inline code
    .replace(/`[^`]*`/g, '')
    // remove JSX/HTML tags
    .replace(/<[^>]+>/g, '')
    // remove heading symbols
    .replace(/^#{1,6}\s+/gm, '')
    // remove bold/italic markers
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // remove link markup, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // collapse blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Parse an MDX file and return a SearchDoc-shaped object.
 * @param {string} filePath
 * @returns {{ id: string; title: string; summary: string; body: string; part: string } | null}
 */
function parseMdxFile(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  const plain = stripMdx(raw)
  const lines = plain.split('\n').map(l => l.trim()).filter(Boolean)

  if (lines.length === 0) return null

  // title: first non-empty line (heading marker already stripped)
  const title = lines[0] ?? ''

  // summary: second non-empty line (first paragraph after heading)
  const summary = lines[1] ?? ''

  // body: everything joined
  const body = lines.join(' ')

  // id: filename without leading NN- prefix and without .mdx
  const file = basename(filePath, '.mdx')
  const id = file.replace(/^\d+-/, '')

  // part: parent folder name (e.g. "p1", "p2"); normalise to uppercase
  const parentFolder = basename(dirname(filePath))
  const part = parentFolder.toUpperCase()

  return { id, title, summary, body, part }
}

function main() {
  const mdxFiles = collectMdxFiles(CONTENT_DIR)

  if (mdxFiles.length === 0) {
    writeFileSync(OUT_FILE, JSON.stringify({ docs: [] }, null, 2))
    console.log('build-search-index: no .mdx files found; wrote { "docs": [] } to', OUT_FILE)
    return
  }

  /** @type {Array<{ id: string; title: string; summary: string; body: string; part: string }>} */
  const docs = []
  for (const file of mdxFiles) {
    const doc = parseMdxFile(file)
    if (doc !== null) {
      docs.push(doc)
    }
  }

  writeFileSync(OUT_FILE, JSON.stringify({ docs }, null, 2))
  console.log(`build-search-index: wrote ${docs.length} doc(s) to`, OUT_FILE)
}

main()
