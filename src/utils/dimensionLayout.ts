import type { DimensionLine } from '../types'
type Point={x:number;y:number}
/** Shared geometry for canvas and SVG. Aligned dimensions measure actual distance. */
export function dimensionLayout(dim:DimensionLine,scale:number) {
  const p={x:dim.x1*scale,y:dim.y1*scale},q={x:dim.x2*scale,y:dim.y2*scale}
  const mode=dim.measurement??(Math.abs(q.x-p.x)>=Math.abs(q.y-p.y)?'horizontal':'vertical')
  let a:Point,b:Point,n:Point,value:number
  const sign=dim.offset>=0?1:-1
  if(mode==='horizontal') {
    const y=sign>0?Math.min(p.y,q.y):Math.max(p.y,q.y)
    a={x:p.x,y};b={x:q.x,y};n={x:0,y:-1};value=Math.abs(dim.x2-dim.x1)
  } else if(mode==='vertical') {
    const x=sign>0?Math.min(p.x,q.x):Math.max(p.x,q.x)
    a={x,y:p.y};b={x,y:q.y};n={x:-1,y:0};value=Math.abs(dim.y2-dim.y1)
  } else {
    const length=Math.hypot(q.x-p.x,q.y-p.y)
    // Stable normal independent of endpoint order.
    const reverse=q.x<p.x || (q.x===p.x&&q.y<p.y)?-1:1
    n=length?{x:reverse*(q.y-p.y)/length,y:-reverse*(q.x-p.x)/length}:{x:0,y:-1}
    a=p;b=q;value=Math.hypot(dim.x2-dim.x1,dim.y2-dim.y1)
  }
  const ref={x:(a.x+b.x)/2,y:(a.y+b.y)/2}
  const shift=(pt:Point,d:number)=>({x:pt.x+n.x*d,y:pt.y+n.y*d})
  a=shift(a,dim.offset*scale);b=shift(b,dim.offset*scale)
  const segment=(a:Point,b:Point)=>[a.x,a.y,b.x,b.y]
  const extension=(source:Point,end:Point)=>{
    const length=Math.hypot(end.x-source.x,end.y-source.y)
    const u=length?{x:(end.x-source.x)/length,y:(end.y-source.y)/length}:n
    return segment({x:source.x+u.x*Math.min(3,length),y:source.y+u.y*Math.min(3,length)},{x:end.x+u.x*6,y:end.y+u.y*6})
  }
  const length=Math.hypot(b.x-a.x,b.y-a.y),u=length?{x:(b.x-a.x)/length,y:(b.y-a.y)/length}:{x:1,y:0}
  const tick=(pt:Point)=>[pt.x-(u.x+n.x)*5,pt.y-(u.y+n.y)*5,pt.x+(u.x+n.x)*5,pt.y+(u.y+n.y)*5]
  const handle={x:(a.x+b.x)/2,y:(a.y+b.y)/2}
  let rotation=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI
  if(rotation>90) rotation-=180
  if(rotation<-90) rotation+=180
  return {value,normal:n,reference:ref,handle,label:shift(handle,sign*12),rotation,line:segment(a,b),ext1:extension(p,a),ext2:extension(q,b),tick1:tick(a),tick2:tick(b)}
}
