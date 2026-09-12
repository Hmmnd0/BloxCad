import { describe, expect, it } from 'vitest'
import { furnitureColor } from './furnitureStyle'
describe('furniture visual palette', () => {
  it('uses cool neutral surfaces consistently', () => {
    expect(furnitureColor('#d0c8bc')).toBe('#d8dee5')
    expect(furnitureColor('#D0C8BC')).toBe('#d8dee5')
    expect(furnitureColor('#e8e0d4')).toBe('#eef1f5')
  })
  it('preserves unrecognized colors and absent paint', () => {
    expect(furnitureColor('#1A1A1A')).toBe('#1A1A1A')
    expect(furnitureColor('none')).toBe('none')
    expect(furnitureColor()).toBeUndefined()
  })
  it('keeps fixture basin and casework surface colors in the same family', () => {
    expect(furnitureColor('#f0f8ff')).toBe('#edf4f8')
    expect(furnitureColor('#e8e4dc')).toBe('#edf0f4')
    expect(furnitureColor('rgba(200,200,200,0.1)')).toBe('rgba(200,200,200,0.1)')
  })
})
