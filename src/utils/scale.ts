import { Scale, SCALES } from '../types'

export function snapToGrid(value: number, snapFeet: number): number {
  return Math.round(value / snapFeet) * snapFeet
}

export function feetToPixels(feet: number, pixelsPerFoot: number): number {
  return feet * pixelsPerFoot
}

export function pixelsToFeet(pixels: number, pixelsPerFoot: number): number {
  return pixels / pixelsPerFoot
}

export function formatFeet(feet: number): string {
  const wholeFeet = Math.floor(Math.abs(feet))
  const inches = Math.round((Math.abs(feet) - wholeFeet) * 12)
  const sign = feet < 0 ? '-' : ''
  if (inches === 0) return `${sign}${wholeFeet}'`
  if (inches === 12) return `${sign}${wholeFeet + 1}'`
  return `${sign}${wholeFeet}'-${inches}"`
}

export function getScaleConfig(scale: Scale) {
  return SCALES[scale]
}

// Format a value in inches as a fractional string (e.g. 3.5 → '3½"', 0.625 → '⅝"')
export function formatInches(inches: number): string {
  const sign = inches < 0 ? '-' : ''
  const abs = Math.abs(inches)
  const whole = Math.floor(abs)
  const frac = abs - whole

  const FRACS: [number, string][] = [
    [0, ''], [0.125, '⅛'], [0.25, '¼'], [0.375, '⅜'],
    [0.5, '½'], [0.625, '⅝'], [0.75, '¾'], [0.875, '⅞'], [1, '']
  ]
  let bestFrac = ''
  let bestDiff = Infinity
  let addOne = false
  for (const [val, sym] of FRACS) {
    const d = Math.abs(frac - val)
    if (d < bestDiff) { bestDiff = d; bestFrac = sym; addOne = val === 1 }
  }
  const w = addOne ? whole + 1 : whole
  if (w === 0 && bestFrac) return `${sign}${bestFrac}"`
  if (!bestFrac) return `${sign}${w}"`
  return `${sign}${w}${bestFrac}"`
}
