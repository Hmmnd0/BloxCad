export type FurnitureShape = { kind: 'rect'; x: number; y: number; width: number; height: number; radius: number; fill: string; stroke: string; weight: number } | { kind: 'line'; points: number[]; stroke: string; weight: number }
export const REFINED_FURNITURE = new Set(['furniture-sofa', 'furniture-chair', 'furniture-bed-twin', 'furniture-bed-full', 'furniture-bed-queen', 'furniture-bed-king', 'furniture-dining-table', 'furniture-coffee-table', 'furniture-desk', 'furniture-dresser', 'furniture-nightstand', 'furniture-bookcase', 'furniture-tv-unit'])

/** A shared, proportion-based shape model for canvas and library. */
export function furnitureGeometry(id: string, width: number, height: number): FurnitureShape[] {
  if (!REFINED_FURNITURE.has(id) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return []
  const bed = id.includes('bed-')
  const transpose = bed ? width > height : height > width
  const w = transpose ? height : width, h = transpose ? width : height
  const unit = Math.min(w, h)
  const shapes: FurnitureShape[] = []
  const rect = (x: number, y: number, width: number, height: number, radius: number, fill = '#f7f9fb', detail = false) => shapes.push({kind:'rect',x,y,width,height,radius,fill,stroke:detail ? '#9aa6b5' : '#344050',weight:detail ? .65 : 1.05})
  const line = (points: number[]) => shapes.push({kind:'line',points,stroke:'#9aa6b5',weight:.65})
  if (bed) {
    rect(0, 0, w, h, unit * .045, '#e4e9ef')
    rect(w * .035, h * .09, w * .93, h * .89, unit * .04, '#fff', true)
    const count = id.endsWith('twin') ? 1 : 2
    const gap = w * .045, pw = (w * .88 - gap * (count - 1)) / count
    for (let i = 0; i < count; i++) rect(w * .06 + i * (pw + gap), h * .13, pw, h * .16, unit * .035, '#f4f6f9', true)
    line([w * .06,h * .36,w * .94,h * .36])
  } else if (id.endsWith('sofa') || id.endsWith('chair')) {
    rect(0, 0, w, h, unit * .09, '#e4e9ef')
    const arm = unit * .12, back = h * .24
    const count = id.endsWith('chair') ? 1 : 3
    const gap = unit * .035, cw = (w - arm * 2 - gap * (count - 1)) / count
    for (let i = 0; i < count; i++) rect(arm + i * (cw + gap), back, cw, h - back - unit * .055, unit * .045, '#fafbfd', true)
    line([arm, h * .13, w - arm, h * .13])
  } else if (id.endsWith('dresser') || id.endsWith('nightstand')) {
    rect(0,0,w,h,unit * .05,'#f4f6f9')
    const count = id.endsWith('nightstand') ? 1 : 2
    // Stable door divisions, independent of drawing scale and thumbnail size.
    for (let i = 1; i < count; i++) line([w * i / count,h * .08,w * i / count,h * .92])
    for (let i = 0; i < count; i++) {
      const cx = w * (i + .5) / count
      line([cx - w / count * .12,h * .82,cx + w / count * .12,h * .82])
    }
  } else if (id.endsWith('bookcase')) {
    rect(0,0,w,h,unit * .045,'#f4f6f9')
    // Back rail and three bays distinguish shelving from a countertop.
    line([w * .04,h * .2,w * .96,h * .2])
    for (let i = 1; i < 3; i++) line([w * i / 3,h * .2,w * i / 3,h * .92])
  } else if (id.endsWith('tv-unit')) {
    rect(0,0,w,h,unit * .05,'#f1f4f7')
    rect(w * .12,h * .1,w * .76,h * .16,unit * .025,'#344050')
    line([w * .5,h * .3,w * .5,h * .47])
    line([w * .43,h * .47,w * .57,h * .47])
    line([w * .04,h * .68,w * .96,h * .68])
  } else if (id.endsWith('desk')) {
    rect(0,0,w,h,unit * .035,'#f4f6f9')
    // A restrained side pedestal distinguishes a desk from a dining table.
    line([w * .73,h * .1,w * .73,h * .9])
    line([w * .79,h * .78,w * .92,h * .78])
  } else {
    // Single tabletop contour; no redundant inset outline.
    rect(0,0,w,h,unit * (id.endsWith('coffee-table') ? .2 : .08),'#f1f4f7')
  }
  if (!transpose) return shapes
  return shapes.map(shape => shape.kind === 'rect' ? {...shape,x:shape.y,y:shape.x,width:shape.height,height:shape.width}
    : {...shape,points:shape.points.flatMap((value,i,a) => i % 2 === 0 ? [a[i + 1],value] : [])})
}
