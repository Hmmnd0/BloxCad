import { describe, it, expect } from 'vitest'
import { snapToGrid, feetToPixels, pixelsToFeet, formatFeet, formatInches, getScaleConfig } from './scale'

describe('snapToGrid', () => {
  it('rounds to the nearest grid increment', () => {
    expect(snapToGrid(4.3, 0.5)).toBe(4.5)
    expect(snapToGrid(4.2, 0.5)).toBe(4)
  })

  it('handles a whole-foot grid', () => {
    expect(snapToGrid(2.4, 1)).toBe(2)
    expect(snapToGrid(2.6, 1)).toBe(3)
  })

  it('handles negative values', () => {
    expect(snapToGrid(-1.7, 0.5)).toBe(-1.5)
  })
})

describe('feetToPixels / pixelsToFeet', () => {
  it('round-trips at a given scale', () => {
    const ppf = 24 // quarter scale
    expect(feetToPixels(10, ppf)).toBe(240)
    expect(pixelsToFeet(240, ppf)).toBe(10)
  })

  it('feetToPixels scales linearly', () => {
    expect(feetToPixels(0, 24)).toBe(0)
    expect(feetToPixels(-5, 24)).toBe(-120)
  })
})

describe('formatFeet', () => {
  it('formats whole feet with no inches', () => {
    expect(formatFeet(7)).toBe("7'")
  })

  it('formats feet-inches', () => {
    expect(formatFeet(7.5)).toBe(`7'-6"`)
  })

  it('rounds inches and carries into the next foot at 12"', () => {
    // 7.999 ft → 11.988" rounds to 12" → should carry to 8', not show 12"
    expect(formatFeet(7.999)).toBe("8'")
  })

  it('formats negative lengths with a leading sign', () => {
    expect(formatFeet(-3.25)).toBe(`-3'-3"`)
  })

  it('formats zero as 0 feet', () => {
    expect(formatFeet(0)).toBe("0'")
  })
})

describe('formatInches', () => {
  it('formats whole inches with no fraction', () => {
    expect(formatInches(3)).toBe('3"')
  })

  it('formats common architectural fractions', () => {
    expect(formatInches(3.5)).toBe('3½"')
    expect(formatInches(0.625)).toBe('⅝"')
  })

  it('drops the whole-number part when it is zero', () => {
    expect(formatInches(0.5)).toBe('½"')
  })

  it('carries into the next whole inch when the fraction rounds to 1', () => {
    // 3.9375 is closer to 4 (whole) than to 3⅞ (0.875) — nearest match is frac=1 → carries
    expect(formatInches(3.95)).toBe('4"')
  })

  it('formats negative values with a leading sign', () => {
    expect(formatInches(-2.25)).toBe('-2¼"')
  })
})

describe('getScaleConfig', () => {
  it('returns pixelsPerFoot and snapFeet for each scale', () => {
    expect(getScaleConfig('eighth')).toEqual({ label: '1/8" = 1\'', pixelsPerFoot: 12, snapFeet: 1.0 })
    expect(getScaleConfig('quarter').pixelsPerFoot).toBe(24)
    expect(getScaleConfig('half').snapFeet).toBe(0.25)
  })
})
