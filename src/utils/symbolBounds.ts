import type { FixtureShape } from './fixtureGeometry'
/** Artwork bounds are for fitting/export only; never use label bounds for snapping. */
export function symbolBounds(shapes:FixtureShape[],w:number,h:number) {
  let x=0,y=0,right=w,bottom=h
  const include=(px:number,py:number)=>{x=Math.min(x,px);y=Math.min(y,py);right=Math.max(right,px);bottom=Math.max(bottom,py)}
  for(const s of shapes) {
    if(s.kind==='line')for(let i=0;i<s.points.length;i+=2)include(s.points[i],s.points[i+1])
    else if(s.kind==='ellipse'){include(s.x-s.rx,s.y-s.ry);include(s.x+s.rx,s.y+s.ry)}
    else {include(s.x,s.y);include(s.x+s.width,s.y+s.height)}
  }
  return {x,y,width:right-x,height:bottom-y}
}
