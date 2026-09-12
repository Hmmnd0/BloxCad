import {describe,it,expect} from 'vitest'
import {parseLengthInput,formatLengthInput} from './lengthInput'
describe('architectural length entry',()=>{
  it.each([`9'8"`,`9'-8"`,`9′8″`,`9 ft 8 in`,`116"`])('reads %s as nine feet eight inches',s=>expect(parseLengthInput(s)).toBeCloseTo(9+8/12,12))
  it('accepts decimal feet and fractional inches',()=>{
    expect(parseLengthInput('9.666667')).toBe(9.666667)
    expect(parseLengthInput(`9'8 1/2"`)).toBeCloseTo(9+8.5/12)
    expect(parseLengthInput('1/2"')).toBeCloseTo(1/24)
  })
  it.each(['','abc','9x8','0','-2','1/0"'])('rejects invalid entry %s',s=>expect(parseLengthInput(s)).toBeNull())
  it('roundtrips dimensions without rounding stored precision',()=>{
    for(const value of [9+8/12,1/24,10,9.123456789])expect(parseLengthInput(formatLengthInput(value))).toBeCloseTo(value,12)
  })
})
