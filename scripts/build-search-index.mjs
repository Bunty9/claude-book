import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'src', 'content')
const OUT_FILE = join(ROOT, 'public', 'search-bodies.json')

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
 * @param {string} raw
 * @returns {string}
 */
function stripMdx(raw) {
  return raw
    .replace(/^(import|export)\s+.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Derive chapter id from file path: basename without leading NN- prefix and .mdx extension.
 * @param {string} filePath
 * @returns {string}
 */
function idFromPath(filePath) {
  const file = basename(filePath, '.mdx')
  return file.replace(/^\d+-/, '')
}

function main() {
  const mdxFiles = collectMdxFiles(CONTENT_DIR)

  if (mdxFiles.length === 0) {
    writeFileSync(OUT_FILE, JSON.stringify({}, null, 2))
    console.log('build-search-index: no .mdx files found; wrote {} to', OUT_FILE)
    return
  }

  /** @type {Record<string, string>} */
  const bodies = {}
  for (const file of mdxFiles) {
    const raw = readFileSync(file, 'utf8')
    const plain = stripMdx(raw)
    const id = idFromPath(file)
    bodies[id] = plain
  }

  writeFileSync(OUT_FILE, JSON.stringify(bodies, null, 2))
  console.log(`build-search-index: wrote ${Object.keys(bodies).length} body/bodies to`, OUT_FILE)
}

main()
