import {it,expect} from 'vitest'
import {pngWithResolution} from './pngResolution'
it('writes one physical-resolution chunk and replaces an old resolution',()=>{
  const bytes=new Uint8Array(45)
  bytes.set([137,80,78,71,13,10,26,10]);new DataView(bytes.buffer).setUint32(8,13)
  bytes.set([73,72,68,82],12);bytes.set([73,69,78,68],37)
  const input='data:image/png;base64,'+btoa(String.fromCharCode(...bytes))
  const result=pngWithResolution(pngWithResolution(input,96),288)
  const out=Uint8Array.from(atob(result.split(',')[1]),c=>c.charCodeAt(0))
  expect(out.length).toBe(66)
  expect(String.fromCharCode(...out.subarray(37,41))).toBe('pHYs')
  expect(new DataView(out.buffer).getUint32(41)).toBe(Math.round(288/.0254))
  expect(new DataView(out.buffer).getUint32(45)).toBe(Math.round(288/.0254))
  expect(out[49]).toBe(1)
})
