/**
 * CSS color math utilities for converting `lab(L a b)` and `oklch(L C H)`
 * values to sRGB.
 *
 * Used by Mermaid.tsx to convert design tokens — authored in `oklch()` and
 * read back through getComputedStyle — into `rgb(...)` strings that Mermaid's
 * color engine (khroma) can parse. Depending on the engine, getComputedStyle
 * returns the resolved color as either `lab(...)` or `oklch(...)`; khroma
 * rejects both, so we convert whichever form we get. All functions are pure;
 * they have no DOM or side-effect dependency.
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

/**
 * Convert a CSS `oklch(L C H)` string (per CSS Color 4) to an sRGB `rgb(...)`
 * string. Returns null if the input is not an oklch() value.
 *
 * L is the 0–1 lightness (a `%` suffix means ÷100, so `50%` → 0.5 — unlike
 * lab(), where `50%` denotes L=50). Any alpha component is ignored.
 */
export function oklchToRgb(value: string): string | null {
  const match = value.match(/^oklch\(\s*([\d.+-]+)(%?)\s+([\d.+-]+)\s+([\d.+-]+)/)
  if (!match) return null
  const L = match[2] === '%' ? Number(match[1]) / 100 : Number(match[1])
  const C = Number(match[3])
  const H = Number(match[4])
  if (!Number.isFinite(L) || !Number.isFinite(C) || !Number.isFinite(H)) return null

  // OKLCh → OKLab (polar → rectangular)
  const hr = (H * Math.PI) / 180
  const a = C * Math.cos(hr)
  const b = C * Math.sin(hr)

  // OKLab → linear sRGB (Björn Ottosson, https://bottosson.github.io/posts/oklab/)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return `rgb(${encodeChannel(r)}, ${encodeChannel(g)}, ${encodeChannel(bl)})`
}
