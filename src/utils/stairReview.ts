import type { PlacedElement } from '../types'

export const STAIR_REFERENCE_URL = 'https://www.iccsafe.org/wp-content/uploads/Session-41-and-67-2021-IRC-Plan-Review.pdf'
export const STAIR_PROFILE = 'irc-2021-straight'
export const isMeasuredStair = (id: string) => id === 'stairs-straight'
export function stairRisers(properties: Record<string, unknown>): number | null {
  const n=properties.stairRiserCount
  return typeof n==='number' && Number.isInteger(n) && n>=2 && n<=64 ? n : null
}
function positive(value:unknown):number|null {
  return typeof value==='number' && Number.isFinite(value) && value>0 ? value : null
}
/** A single straight flight, upper landing is the final walking surface.
 * N risers therefore have N−1 treads. Plan long dimension is the nosing-to-
 * nosing total horizontal run; landings are separate elements. No migration
 * from legacy decorative stepCount: it did not establish a physical count. */
export function stairMeasurements(el: Pick<PlacedElement,'width'|'height'|'properties'>) {
  const p=el.properties, risers=stairRisers(p), riseFt=positive(p.stairRiseFt)
  const runFt=positive(Math.max(el.width,el.height))
  return {
    risers, treads:risers===null?null:risers-1, riseFt, runFt,
    riserIn:risers!==null&&riseFt!==null?riseFt*12/risers:null,
    treadIn:risers!==null&&runFt!==null?runFt*12/(risers-1):null,
    headroomIn:positive(p.stairHeadroomIn),
    clearWidthIn:positive(p.stairClearWidthIn),
    referenceSelected:p.stairReviewProfile===STAIR_PROFILE,
  }
}
export interface StairFinding {
  id:string; elementId:string; severity:'warning'|'error'; message:string
  status:'unverified'|'measured'; referenceUrl?:string
}

type Point={x:number;y:number}
function world(el:PlacedElement,x:number,y:number):Point {
  const a=el.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a)
  const dx=x-el.width/2,dy=y-el.height/2
  return {x:el.x+el.width/2+dx*c-dy*s,y:el.y+el.height/2+dx*s+dy*c}
}
function contains(el:PlacedElement,p:Point) {
  const a=-el.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a)
  const dx=p.x-el.x-el.width/2,dy=p.y-el.y-el.height/2
  const x=dx*c-dy*s+el.width/2,y=dx*s+dy*c+el.height/2
  return x>=-1e-6&&x<=el.width+1e-6&&y>=-1e-6&&y<=el.height+1e-6
}
/** Conservative plan coverage, not a floor/landing compliance determination.
 * Require one landing to cover a complete 3ft-deep rectangle outside each
 * end, including full flight width; exact rotation, no proximity guess. */
export function stairLandingCoverage(stair:PlacedElement,elements:PlacedElement[]):boolean[] {
  const vertical=stair.height>=stair.width,w=stair.width,h=stair.height
  const boxes=vertical?[[0,-3,w,0],[0,h,w,h+3]]:[[-3,0,0,h],[w,0,w+3,h]]
  const landings=elements.filter(e=>e.bloxId==='stairs-landing'&&e.layerId===stair.layerId)
  return boxes.map(([x1,y1,x2,y2])=>landings.some(l=>[[x1,y1],[x2,y1],[x2,y2],[x1,y2]].every(([x,y])=>contains(l,world(stair,x,y)))))
}
export function reviewStraightStairs(elements:PlacedElement[]):StairFinding[] {
  const results:StairFinding[]=[]
  for(const el of elements.filter(e=>isMeasuredStair(e.bloxId))) {
    const m=stairMeasurements(el)
    const add=(key:string,message:string,status:'unverified'|'measured'='unverified')=>results.push({
      id:`stair-${key}-${el.id}`,elementId:el.id,severity:status==='measured'?'error':'warning',status,message,
      ...(m.referenceSelected?{referenceUrl:STAIR_REFERENCE_URL}:{}),
    })
    if(!m.referenceSelected) add('reference','Stair reference not selected. Choose a review profile in the inspector; jurisdiction, adopted edition and applicability remain unverified.')
    const missing=[m.riseFt===null?'total flight rise (ft)':null,m.risers===null?'physical riser count (integer 2–64)':null,m.headroomIn===null?'minimum headroom (in)':null,m.clearWidthIn===null?'clear width above handrails (in)':null].filter(Boolean)
    if(missing.length) add('inputs',`Stair measurements missing or invalid: ${missing.join(', ')}. Decorative step count is not physical design data.`)
    if(m.clearWidthIn!==null&&m.clearWidthIn>Math.min(el.width,el.height)*12+1e-6) add('width-conflict','Entered clear width exceeds the drawn stair footprint. Reconcile the measurement and plan geometry.','measured')
    if(m.referenceSelected) {
      // 2021 IRC R311.7.1/.2/.5.1/.5.2. Selected baseline only, not a
      // jurisdiction decision; exceptions and other stair forms are excluded.
      if(m.riserIn!==null&&m.riserIn>7.75+1e-6) add('riser',`Calculated riser ${m.riserIn.toFixed(2)} in exceeds the selected 2021 IRC baseline of 7.75 in (R311.7.5.1).`,'measured')
      if(m.treadIn!==null&&m.treadIn<10-1e-6) add('tread',`Calculated tread ${m.treadIn.toFixed(2)} in is below the selected 2021 IRC baseline of 10 in (R311.7.5.2).`,'measured')
      if(m.headroomIn!==null&&m.headroomIn<80-1e-6) add('headroom',`Entered minimum headroom ${m.headroomIn.toFixed(2)} in is below the selected 2021 IRC baseline of 80 in (R311.7.2).`,'measured')
      if(m.clearWidthIn!==null&&m.clearWidthIn<36-1e-6) add('width',`Entered clear width above handrails ${m.clearWidthIn.toFixed(2)} in is below the selected 2021 IRC baseline of 36 in (R311.7.1).`,'measured')
      const coverage=stairLandingCoverage(el,elements)
      if(coverage.some(v=>!v)) add('landings',`Landing plan coverage unverified at ${coverage.filter(v=>!v).length} of 2 flight ends. No single same-layer landing covers the full flight width and 36 in beyond the end. A floor may serve instead; verify its geometry and applicable exceptions.`)
    }
    // Never let an unrelated rail or an attractive thumbnail clear this check.
    add('scope','Stair review remains partial: verify handrails, guards, nosings, riser/tread uniformity, landing elevations, maximum flight rise, headroom source and local amendments. Entered rise and headroom are not inferred from the 2D plan.')
  }
  for(const el of elements.filter(e=>e.bloxId==='stairs-hatch'||e.bloxId==='stairs-elevation')) results.push({id:`stair-unsupported-${el.id}`,elementId:el.id,severity:'warning',status:'unverified',message:'This stair symbol is schematic. Physical review currently supports straight plan flights only; hatch/elevation geometry has not been checked.'})
  return results
}
