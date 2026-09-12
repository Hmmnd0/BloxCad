/** PNG's pixel dimensions alone do not specify print scale. Embed pHYs at
 * the compositor's actual DPI so image editors do not assume 72/96 DPI. */
export function pngWithResolution(dataUrl:string,dpi:number):string {
  const bytes=Uint8Array.from(atob(dataUrl.split(',')[1]),c=>c.charCodeAt(0))
  const chunk=new Uint8Array(21),view=new DataView(chunk.buffer)
  view.setUint32(0,9);chunk.set([112,72,89,115],4)
  const ppm=Math.round(dpi/.0254);view.setUint32(8,ppm);view.setUint32(12,ppm);chunk[16]=1
  let crc=0xffffffff
  for(const byte of chunk.subarray(4,17)) {crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
  view.setUint32(17,(crc^0xffffffff)>>>0)
  const parts:Uint8Array[]=[bytes.subarray(0,33),chunk]
  for(let offset=33;offset<bytes.length;) {
    const len=new DataView(bytes.buffer).getUint32(offset)+12
    if(String.fromCharCode(...bytes.subarray(offset+4,offset+8))!=='pHYs')parts.push(bytes.subarray(offset,offset+len))
    offset+=len
  }
  const strings:string[]=[]
  for(const part of parts)for(let i=0;i<part.length;i+=8192)strings.push(String.fromCharCode(...part.subarray(i,i+8192)))
  return 'data:image/png;base64,'+btoa(strings.join(''))
}
