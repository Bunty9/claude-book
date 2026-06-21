/**
 * CIELAB color math utilities for converting CSS `lab(L a b)` values to sRGB.
 *
 * Used by Mermaid.tsx to convert tokens that getComputedStyle normalises to
 * `lab(...)` into `rgb(...)` strings that Mermaid's color engine (khroma) can
 * parse. Both functions are pure; they have no DOM or side-effect dependency.
 */

/**
 * Gamma-encode one linear-sRGB channel and quantize to 0-255.
 *
 * Applies the IEC 61966-2-1 piecewise transfer function, clamps the result to
 * [0, 1], and rounds to the nearest integer in [0, 255].
 */
export function encodeChannel(linear: number): number {
  const c = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
}

/**
 * Convert a CSS `lab(L a b)` string (D50 white point, per CSS Color 4) to
 * an sRGB `rgb(...)` string. Returns null if the input is not a lab() value.
 */
export function labToRgb(value: string): string | null {
  const match = value.match(/^lab\(\s*([\d.+-]+)%?\s+([\d.+-]+)\s+([\d.+-]+)/)
  if (!match) return null
  const L = Number(match[1])
  const a = Number(match[2])
  const b = Number(match[3])
  if (!Number.isFinite(L) || !Number.isFinite(a) || !Number.isFinite(b)) return null

  // CIELAB → XYZ (D50)
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  const epsilon = 216 / 24389
  const kappa = 24389 / 27
  const fx3 = fx ** 3
  const fz3 = fz ** 3
  const xr = fx3 > epsilon ? fx3 : (116 * fx - 16) / kappa
  const yr = L > kappa * epsilon ? fy ** 3 : L / kappa
  const zr = fz3 > epsilon ? fz3 : (116 * fz - 16) / kappa
  const X = xr * 0.96422
  const Y = yr * 1.0
  const Z = zr * 0.82521

  // XYZ (D50) → linear sRGB (Bradford-adapted matrix, CSS Color 4)
  const r = 3.1341359 * X - 1.6173086 * Y - 0.4906238 * Z
  const g = -0.9787553 * X + 1.9161606 * Y + 0.033454 * Z
  const bl = 0.0719453 * X - 0.2289914 * Y + 1.4052427 * Z
  return `rgb(${encodeChannel(r)}, ${encodeChannel(g)}, ${encodeChannel(bl)})`
}
