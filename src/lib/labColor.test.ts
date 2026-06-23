import { describe, it, expect } from 'vitest'
import { encodeChannel, labToRgb, oklchToRgb } from './labColor'

// ---------------------------------------------------------------------------
// encodeChannel
// ---------------------------------------------------------------------------
describe('encodeChannel', () => {
  it('maps 0 → 0', () => {
    expect(encodeChannel(0)).toBe(0)
  })

  it('maps 1 → 255', () => {
    expect(encodeChannel(1)).toBe(255)
  })

  it('clamps negative input to 0', () => {
    expect(encodeChannel(-0.5)).toBe(0)
  })

  it('clamps input > 1 to 255', () => {
    expect(encodeChannel(2)).toBe(255)
  })

  it('uses linear segment for 0.001 (≤ 0.0031308) → 3', () => {
    // c = 12.92 * 0.001 = 0.01292 → round(0.01292 * 255) = round(3.2946) = 3
    expect(encodeChannel(0.001)).toBe(3)
  })

  it('uses power segment for 0.01 (> 0.0031308) → 25', () => {
    // c = 1.055 * 0.01^(1/2.4) - 0.055 ≈ 0.09985 → round(0.09985 * 255) = round(25.46) = 25
    expect(encodeChannel(0.01)).toBe(25)
  })
})

// ---------------------------------------------------------------------------
// labToRgb — parse rejection
// ---------------------------------------------------------------------------
describe('labToRgb — parse rejection', () => {
  it('returns null for rgb(...)', () => {
    expect(labToRgb('rgb(255, 0, 0)')).toBeNull()
  })

  it('returns null for oklch(...)', () => {
    expect(labToRgb('oklch(0.5 0.1 200)')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(labToRgb('')).toBeNull()
  })

  it('returns null for lab() with no numbers', () => {
    expect(labToRgb('lab()')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// labToRgb — correctness anchors
// ---------------------------------------------------------------------------
describe('labToRgb — correctness', () => {
  it('lab(0 0 0) → rgb(0, 0, 0)', () => {
    expect(labToRgb('lab(0 0 0)')).toBe('rgb(0, 0, 0)')
  })

  it('lab(100 0 0) → rgb(255, 255, 255)', () => {
    expect(labToRgb('lab(100 0 0)')).toBe('rgb(255, 255, 255)')
  })

  it('lab(50 0 0) → neutral grey: r === g === b and value is in 115..123', () => {
    const result = labToRgb('lab(50 0 0)')
    expect(result).not.toBeNull()
    const m = result!.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
    expect(m).not.toBeNull()
    const [r, g, b] = [Number(m![1]), Number(m![2]), Number(m![3])]
    expect(r).toBe(g)
    expect(g).toBe(b)
    expect(r).toBeGreaterThanOrEqual(115)
    expect(r).toBeLessThanOrEqual(123)
  })

  it('greyscale is monotonically brighter as L increases', () => {
    const extract = (lab: string) => {
      const result = labToRgb(lab)
      expect(result).not.toBeNull()
      const m = result!.match(/^rgb\((\d+),/)
      return Number(m![1])
    }
    const g25 = extract('lab(25 0 0)')
    const g50 = extract('lab(50 0 0)')
    const g75 = extract('lab(75 0 0)')
    expect(g25).toBeLessThan(g50)
    expect(g50).toBeLessThan(g75)
  })

  it('lab(50% 0 0) parses and equals lab(50 0 0)', () => {
    // The regex accepts an optional % suffix on L, treating the numeric value
    // identically (i.e. L=50, not L=0.5*100 or anything else).
    expect(labToRgb('lab(50% 0 0)')).toBe(labToRgb('lab(50 0 0)'))
  })
})

// ---------------------------------------------------------------------------
// oklchToRgb — parse rejection
// ---------------------------------------------------------------------------
describe('oklchToRgb — parse rejection', () => {
  it('returns null for rgb(...)', () => {
    expect(oklchToRgb('rgb(255, 0, 0)')).toBeNull()
  })

  it('returns null for lab(...)', () => {
    expect(oklchToRgb('lab(50 40 59.5)')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(oklchToRgb('')).toBeNull()
  })

  it('returns null for oklch() with no numbers', () => {
    expect(oklchToRgb('oklch()')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// oklchToRgb — correctness anchors
//
// Expected rgb values are ground-truthed against the browser's painted pixels
// (canvas getImageData) for the corresponding oklch() colors.
// ---------------------------------------------------------------------------
describe('oklchToRgb — correctness', () => {
  it('oklch(0 0 0) → rgb(0, 0, 0)', () => {
    expect(oklchToRgb('oklch(0 0 0)')).toBe('rgb(0, 0, 0)')
  })

  it('oklch(1 0 0) → rgb(255, 255, 255)', () => {
    expect(oklchToRgb('oklch(1 0 0)')).toBe('rgb(255, 255, 255)')
  })

  it('matches painted-pixel ground truth for the dark token palette', () => {
    expect(oklchToRgb('oklch(0.21 0.008 240)')).toBe('rgb(21, 25, 28)')
    expect(oklchToRgb('oklch(0.95 0.003 240)')).toBe('rgb(237, 239, 240)')
    expect(oklchToRgb('oklch(0.13 0.005 240)')).toBe('rgb(6, 8, 9)')
  })

  it('matches painted-pixel ground truth for a saturated hue', () => {
    expect(oklchToRgb('oklch(0.65 0.2 25)')).toBe('rgb(241, 77, 76)')
  })

  it('greyscale is monotonically brighter as L increases', () => {
    const extract = (oklch: string) => {
      const result = oklchToRgb(oklch)
      expect(result).not.toBeNull()
      const m = result!.match(/^rgb\((\d+),/)
      return Number(m![1])
    }
    const g25 = extract('oklch(0.25 0 0)')
    const g50 = extract('oklch(0.5 0 0)')
    const g75 = extract('oklch(0.75 0 0)')
    expect(g25).toBeLessThan(g50)
    expect(g50).toBeLessThan(g75)
  })

  it('oklch(50% 0 0) parses as L=0.5 (percent ÷100, unlike lab)', () => {
    // A % suffix on oklch lightness means ÷100, so 50% ≡ 0.5 — distinct from
    // lab(), where 50% denotes L=50.
    expect(oklchToRgb('oklch(50% 0 0)')).toBe(oklchToRgb('oklch(0.5 0 0)'))
  })
})
