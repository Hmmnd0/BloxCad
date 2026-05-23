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
