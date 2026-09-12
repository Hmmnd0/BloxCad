import React from 'react'
import { Group, Text } from 'react-konva'
import { useStore } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE_THIN, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'
const STROKE = '#334155'

// One optical system for paper-space reference symbols. Fit identifiers rather
// than wrapping them into extra lines when a sheet or door number is longer.
function ReferenceText({ x, y, width, height, text, size, bold = true }: {
  x: number; y: number; width: number; height: number; text: string; size: number; bold?: boolean
}) {
  return <Text x={x} y={y} width={width} height={height} text={text}
    fontSize={Math.max(1, Math.min(size, height * .78, width / Math.max(1, text.length) / .72))}
    fontFamily={ARC_FONT} fontStyle={bold ? 'bold' : 'normal'} fill={STROKE}
    align="center" verticalAlign="middle" wrap="none" listening={false} />
}

function ReferenceBubble({ cx, cy, r, label, sheet }: { cx: number; cy: number; r: number; label: string; sheet?: string }) {
  return <Group>
    <Circle x={cx} y={cy} radius={r} fill="white" stroke={STROKE} strokeWidth={1.25}/>
    {sheet !== undefined ? <>
      <Line points={[cx-r,cy,cx+r,cy]} stroke={STROKE} strokeWidth={.65}/>
      <ReferenceText x={cx-r*.78} y={cy-r*.88} width={r*1.56} height={r*.84} text={label} size={r*.72}/>
      <ReferenceText x={cx-r*.78} y={cy+.04*r} width={r*1.56} height={r*.84} text={sheet} size={r*.57} bold={false}/>
    </> : <ReferenceText x={cx-r*.8} y={cy-r*.7} width={r*1.6} height={r*1.4} text={label} size={r*.95}/>}
  </Group>
}

export function NorthArrowRenderer({ widthPx, heightPx }: RendererProps) {
  const cx=widthPx/2, r=Math.max(1,Math.min(widthPx*.44,heightPx*.34)), cy=heightPx-r-1
  return <Group>
    <Circle x={cx} y={cy} radius={r*.83} stroke={STROKE} strokeWidth={.65}/>
    <Line points={[cx,cy-r,cx-r*.3,cy+r*.72,cx,cy+r*.38]} closed fill={STROKE} stroke={STROKE} strokeWidth={.8}/>
    <Line points={[cx,cy-r,cx+r*.3,cy+r*.72,cx,cy+r*.38]} closed fill="white" stroke={STROKE} strokeWidth={.8}/>
    <ReferenceText x={0} y={0} width={widthPx} height={Math.max(1,cy-r-2)} text="N" size={r*.65}/>
  </Group>
}

export function FireRatingLabelRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const rating = (properties.rating as string) ?? '1-HR'
  const label = `${rating} RATED ASSEMBLY`
  const fontSize = Math.max(9, Math.min(14, heightPx * .55))
  // This is a paper annotation, not a physical assembly footprint. Keep its
  // complete label legible even when the placed bounding box is undersized.
  const labelWidth = Math.max(widthPx, label.length * fontSize * .75 + 12)
  const labelHeight = Math.max(heightPx, fontSize * 1.3)
  return (
    <Group>
      <Rect width={labelWidth} height={labelHeight}
        fill="white" stroke={STROKE} strokeWidth={0.75} />
      <Rect width={3} height={labelHeight} fill={STROKE}/>
      <Text
        text={label}
        x={6} y={0} height={labelHeight} verticalAlign="middle"
        width={labelWidth-12} wrap="none"
        fontSize={fontSize} fontFamily={ARC_FONT}
        fontStyle="bold" fill={STROKE} listening={false}
      />
    </Group>
  )
}

export function TextNoteRenderer({ widthPx, heightPx, properties, selected }: RendererProps) {
  const text = (properties.text as string) ?? 'Note'
  const fontSize = typeof properties.fontSize === 'number' ? Math.max(6, Math.min(48, properties.fontSize)) : 11
  return (
    <Group>
      {selected&&<Rect width={widthPx} height={heightPx}
        fill="rgba(255,255,255,0.0)" stroke="#888" strokeWidth={0.6}
        dash={[4, 3]} />}
      <Text
        text={text}
        x={4} y={4} width={Math.max(1,widthPx - 8)}
        fontSize={fontSize} fontFamily={ARC_FONT} fill="#334155" lineHeight={1.35}
        wrap="word" listening={false}
      />
    </Group>
  )
}

// ─── FIRE/SAFETY ─────────────────────────────────────────────────────────────

export function HumanScaleRenderer({widthPx,heightPx}:RendererProps) {
  // Relaxed standing figure, drawn in normalized coordinates to preserve stature.
  const p=[.39,.22,.23,.26,.12,.52,.20,.55,.32,.36,.34,.57,.28,.97,.41,.97,.5,.64,.59,.97,.72,.97,.66,.57,.68,.36,.80,.55,.88,.52,.77,.26,.61,.22]
  return <Group>
    <Ellipse x={widthPx*.5} y={heightPx*.105} radiusX={widthPx*.14} radiusY={heightPx*.095} fill="#E1E6EA" stroke={STROKE} strokeWidth={.65}/>
    <Line points={p.map((v,i)=>v*(i%2?heightPx:widthPx))} closed fill="#E1E6EA" stroke={STROKE} strokeWidth={.65} lineJoin="round"/>
  </Group>
}

// ─── DRESSER ──────────────────────────────────────────────────────────────────

export function TerraceEdgeRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#F5F6F7" stroke="transparent" />
      {isLandscape ? (
        <>
          <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={1.25} />
          <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={0.75} dash={[8, 5]} />
          <Line points={[0, 0, 0, heightPx]} stroke={STROKE} strokeWidth={1} />
          <Line points={[widthPx, 0, widthPx, heightPx]} stroke={STROKE} strokeWidth={1} />
        </>
      ) : (
        <>
          <Line points={[0, 0, 0, heightPx]} stroke={STROKE} strokeWidth={1.25} />
          <Line points={[widthPx, 0, widthPx, heightPx]} stroke={STROKE} strokeWidth={0.75} dash={[8, 5]} />
          <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={1} />
          <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={1} />
        </>
      )}
    </Group>
  )
}

// ─── POLYGON ─────────────────────────────────────────────────────────────────

export function AnnotationLeaderRenderer({widthPx,heightPx,properties}:RendererProps) {
  const label=String(properties.label??'Label').toUpperCase()
  const elbow=widthPx*.26,tipY=heightPx*.88,landY=heightPx*.53
  const dx=elbow,dy=landY-tipY,len=Math.max(1,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len
  const head=Math.min(8,len*.26),half=head*.22
  const size=typeof properties.fontSize==='number'?Math.max(6,Math.min(36,properties.fontSize)):Math.min(12,heightPx*.34)
  return <Group>
    <Line points={[0,tipY,elbow,landY,widthPx,landY]} stroke={STROKE} strokeWidth={.75}/>
    <Line points={[0,tipY,ux*head-uy*half,tipY+uy*head+ux*half,ux*head+uy*half,tipY+uy*head-ux*half]} closed fill={STROKE}/>
    <ReferenceText x={elbow+4} y={0} width={Math.max(1,widthPx-elbow-4)} height={landY-2} text={label} size={size} bold={false}/>
  </Group>
}

export function AnnotationSectionCutRenderer({widthPx,heightPx,properties}:RendererProps) {
  const r=Math.max(1,Math.min(heightPx*.31,widthPx*.12,14)),cy=heightPx*.64
  const label=String(properties.label??'A')
  return <Group>
    <Line points={[r,cy,widthPx-r,cy]} stroke={STROKE} strokeWidth={.85} dash={[16,4,3,4]}/>
    {[r,widthPx-r].map((x,i)=><Group key={i}>
      <Line points={[x,cy-r,x,0]} stroke={STROKE} strokeWidth={1.5}/>
      <Line points={[x,0,x-r*.38,r*.65,x+r*.38,r*.65]} closed fill={STROKE}/>
      <ReferenceBubble cx={x} cy={cy} r={r} label={label}/>
    </Group>)}
  </Group>
}

export function AnnotationGridBubbleRenderer({widthPx,heightPx,properties}:RendererProps) {
  const cx=widthPx/2,r=Math.max(1,Math.min(widthPx*.44,heightPx*.24,16))
  return <Group>
    <Line points={[cx,r*2,cx,heightPx]} stroke={STROKE} strokeWidth={.65} dash={[12,3,2,3]}/>
    <ReferenceBubble cx={cx} cy={r} r={r} label={String(properties.label??'A')}/>
  </Group>
}

export function AnnotationBreakLineRenderer({ widthPx, heightPx }: RendererProps) {
  const cy = heightPx * 0.5
  const amp = Math.min(heightPx * 0.4, 8)
  return (
    <Group>
      <Line
        points={[
          0, cy,
          widthPx*.42,cy,
          widthPx*.47,cy-amp,
          widthPx*.53,cy+amp,
          widthPx*.58,cy,
          widthPx, cy,
        ]}
        stroke={STROKE} strokeWidth={.85} lineJoin="miter"
      />
    </Group>
  )
}

export function AnnotationElevationMarkerRenderer({widthPx,heightPx,properties}:RendererProps) {
  const cx=widthPx/2,cy=heightPx/2,r=Math.max(1,Math.min(widthPx,heightPx)*.37)
  const angles:Record<string,number>={right:0,down:90,left:180,up:-90,ne:-45,nw:-135,se:45,sw:135}
  const a=(typeof properties.angleDeg==='number'?properties.angleDeg:angles[String(properties.direction??'right')]??0)*Math.PI/180
  const ux=Math.cos(a),uy=Math.sin(a),bx=cx+ux*r*.94,by=cy+uy*r*.94
  return <Group>
    <Line points={[cx+ux*r*1.32,cy+uy*r*1.32,bx-uy*r*.32,by+ux*r*.32,bx+uy*r*.32,by-ux*r*.32]} closed fill={STROKE} stroke={STROKE} strokeWidth={.75}/>
    <ReferenceBubble cx={cx} cy={cy} r={r} label={String(properties.label??'1')} />
  </Group>
}

export function AnnotationDetailBubbleRenderer({widthPx,heightPx,properties}:RendererProps) {
  return <ReferenceBubble cx={widthPx/2} cy={heightPx/2} r={Math.max(1,Math.min(widthPx,heightPx)/2-1)}
    label={String(properties.detailNum??'1')} sheet={String(properties.sheetRef??'A-1')}/>
}

export function AnnotationRevisionCloudRenderer({ widthPx, heightPx }: RendererProps) {
  const segments = 16
  const points: number[] = []
  // Sample distinct outward scallops; smoothing the vertices of an ellipse
  // erases the revision-cloud notation.
  const samplesPerScallop = 12
  for (let i = 0; i < segments * samplesPerScallop; i++) {
    const angle = i / (segments * samplesPerScallop) * 2 * Math.PI - Math.PI / 2
    const radius = 0.40 + 0.08 * Math.sin(Math.PI * (i % samplesPerScallop) / samplesPerScallop)
    points.push(widthPx * (0.5 + radius * Math.cos(angle)), heightPx * (0.5 + radius * Math.sin(angle)))
  }
  return (
    <Group>
      <Line points={points} stroke={STROKE} strokeWidth={.85} closed />
    </Group>
  )
}

export function AnnotationSlopeArrowRenderer({widthPx,heightPx,properties}:RendererProps) {
  const cy=heightPx*.72,head=Math.min(10,widthPx*.15,heightPx*.5)
  return <Group>
    <Line points={[0,cy,widthPx,cy]} stroke={STROKE} strokeWidth={.75}/>
    <Line points={[0,cy-3,0,cy+3]} stroke={STROKE} strokeWidth={.75}/>
    <Line points={[widthPx-head,cy-head*.25,widthPx,cy,widthPx-head,cy+head*.25]} closed fill={STROKE}/>
    <ReferenceText x={0} y={0} width={widthPx-head} height={cy-3} text={String(properties.slopeLabel??'1:12')} size={11} bold={false}/>
  </Group>
}

export function AnnotationAccessibleRenderer({ widthPx, heightPx }: RendererProps) {
  const s = Math.min(widthPx, heightPx)
  const ox = (widthPx - s) / 2
  const oy = (heightPx - s) / 2
  const u = (v: number) => v * s
  return (
    <Group>
      <Rect
        x={ox} y={oy} width={s} height={s} cornerRadius={u(0.04)}
        fill={STROKE} stroke={STROKE} strokeWidth={STROKE_THIN}
      />
      <Group x={ox} y={oy}>
        {/* head */}
        <Circle x={u(0.52)} y={u(0.19)} radius={u(0.08)} fill="white" />
        {/* torso, seat, and lower leg */}
        <Line
          points={[u(0.52), u(0.28), u(0.52), u(0.55), u(0.74), u(0.55), u(0.74), u(0.72)]}
          stroke="white" strokeWidth={u(0.07)} lineCap="round" lineJoin="round"
        />
        {/* arm */}
        <Line points={[u(0.52), u(0.38), u(0.7), u(0.38)]} stroke="white" strokeWidth={u(0.06)} lineCap="round" />
        {/* wheel */}
        <Arc
          x={u(0.46)} y={u(0.6)} innerRadius={u(0.25)} outerRadius={u(0.25)}
          angle={300} rotation={30} stroke="white" strokeWidth={u(0.06)}
        />
      </Group>
    </Group>
  )
}

export function AnnotationElevationTargetRenderer({widthPx,heightPx,properties}:RendererProps) {
  const cx=widthPx/2,cy=heightPx/2,r=Math.max(1,Math.min(widthPx,heightPx)*.37)
  const angles:Record<string,number>={right:0,down:90,left:180,up:-90,ne:-45,nw:-135,se:45,sw:135}
  const a=(typeof properties.angleDeg==='number'?properties.angleDeg:angles[String(properties.direction??'right')]??0)*Math.PI/180
  const ux=Math.cos(a),uy=Math.sin(a),bx=cx+ux*r*.94,by=cy+uy*r*.94
  return <Group>
    <Line points={[cx+ux*r*1.32,cy+uy*r*1.32,bx-uy*r*.32,by+ux*r*.32,bx+uy*r*.32,by-ux*r*.32]} closed fill={STROKE} stroke={STROKE} strokeWidth={.75}/>
    <ReferenceBubble cx={cx} cy={cy} r={r} label={String(properties.viewNum??'1')} sheet={String(properties.sheetRef??'A-3')}/>
  </Group>
}

// ─── ROOM TAG ─────────────────────────────────────────────────────────────────

export function AnnotationRoomTagRenderer({widthPx,heightPx,properties}:RendererProps) {
  const name=String(properties.roomName??'ROOM NAME').toUpperCase()
  const number=String(properties.roomNum??''),area=String(properties.roomArea??'')
  const pad=widthPx*.07,hasMeta=!!(number||area),nameH=heightPx*(hasMeta?.52:.76)
  return <Group>
    <ReferenceText x={pad} y={0} width={widthPx-pad*2} height={nameH} text={name} size={Math.min(16,heightPx*.32)}/>
    <Line points={[pad,nameH,widthPx-pad,nameH]} stroke={STROKE} strokeWidth={1}/>
    {hasMeta&&<ReferenceText x={pad} y={nameH+2} width={widthPx-pad*2} height={heightPx-nameH-2}
      text={[number,area].filter(Boolean).join('  ·  ')} size={Math.min(11,heightPx*.23)} bold={false}/>}
  </Group>
}

// ─── DOOR TAG ─────────────────────────────────────────────────────────────────

export function AnnotationDoorTagRenderer({widthPx,heightPx,properties}:RendererProps) {
  const cx=widthPx/2,cy=heightPx/2,r=Math.max(1,Math.min(widthPx,heightPx)/2-1)
  const points=Array.from({length:6},(_,i)=>[cx+r*Math.cos(i*Math.PI/3),cy+r*Math.sin(i*Math.PI/3)]).flat()
  return <Group>
    <Line points={points} closed stroke={STROKE} strokeWidth={1.25} fill="white"/>
    <ReferenceText x={cx-r*.78} y={cy-r*.65} width={r*1.56} height={r*1.3} text={String(properties.label??'1')} size={r*.88}/>
  </Group>
}

// ─── SECTION REFERENCE BUBBLE ────────────────────────────────────────────────

export function AnnotationSectionRefRenderer({widthPx,heightPx,properties}:RendererProps) {
  return <ReferenceBubble cx={widthPx/2} cy={heightPx/2} r={Math.max(1,Math.min(widthPx,heightPx)/2-1)}
    label={String(properties.secNum??'A')} sheet={String(properties.sheetRef??'A-2')}/>
}

// ─── COLUMN GRID (HORIZONTAL) ────────────────────────────────────────────────

export function AnnotationColumnGridHRenderer({widthPx,heightPx,properties}:RendererProps) {
  const cy=heightPx/2,r=Math.max(1,Math.min(heightPx*.44,widthPx*.24,16))
  return <Group>
    <Line points={[0,cy,widthPx-r*2,cy]} stroke={STROKE} strokeWidth={.65} dash={[12,3,2,3]}/>
    <ReferenceBubble cx={widthPx-r} cy={cy} r={r} label={String(properties.label??'A')}/>
  </Group>
}

// ─── DRAWING TITLE ────────────────────────────────────────────────────────────

export function AnnotationDrawingTitleRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const project    = useStore(s => s.project)
  const tb         = project?.titleBlock
  const title      = ((properties.title      as string | undefined) ?? tb?.drawingTitle ?? project?.name ?? 'DRAWING TITLE').toUpperCase()
  const drawingNum = (properties.drawingNum as string | undefined) ?? tb?.sheetNumber  ?? 'A-1'
  const scale      = (properties.scale      as string | undefined) ?? (project ? SCALES[project.scale]?.label : "1/4\" = 1'-0\"")

  const lineY       = heightPx * 0.60        // underline position
  const bubbleR     = Math.min(heightPx * 0.43, widthPx * 0.075)
  const bubbleY     = heightPx / 2
  const textStart   = bubbleR * 2 + Math.max(8, heightPx * .2)
  const titleFontSz = Math.max(1, Math.min(lineY * .62, (widthPx-textStart) / Math.max(1,title.length) / .75))
  const infoFontSz  = Math.max(7, (heightPx - lineY - 2) * 0.66)

  return (
    <Group>
      {/* Open reference circle spans the title and scale rows. */}
      <Circle x={bubbleR} y={bubbleY} radius={bubbleR}
        stroke={STROKE} strokeWidth={1.4} fill="white" listening={false} />
      <Text x={0} y={bubbleY-bubbleR} width={bubbleR*2} height={bubbleR*2} text={drawingNum} fontSize={Math.min(bubbleR*1.1,bubbleR*2.1/Math.max(1,drawingNum.length))} fontFamily={ARC_FONT} fill={STROKE} align="center" verticalAlign="middle" fontStyle="bold"/>
      {/* Bold uppercase title */}
      <Text
        x={textStart} y={0} width={widthPx - textStart} height={lineY}
        text={title}
        fontSize={titleFontSz}
        fontFamily={ARC_FONT} fontStyle="bold"
        fill={STROKE} verticalAlign="middle"
        letterSpacing={0.3}
        listening={false}
      />
      {/* Single hairline underline extending full width */}
      <Line points={[textStart, lineY, widthPx, lineY]} stroke={STROKE} strokeWidth={1.5} listening={false} />
      {/* The reference number appears once, in the bubble; scale aligns with the title. */}
      <Text
        x={textStart} y={lineY + 3}
        width={widthPx - textStart} height={heightPx - lineY - 3}
        text={`SCALE: ${scale}`}
        fontSize={infoFontSz}
        fontFamily={ARC_FONT}
        fill={STROKE} verticalAlign="middle"
        listening={false}
      />
    </Group>
  )
}

// ─── BACK REFERENCE TARGET ────────────────────────────────────────────────────

export function AnnotationBackReferenceRenderer({widthPx,heightPx,properties}:RendererProps) {
  const tip=Math.min(heightPx*.38,widthPx*.28),w=widthPx-tip
  return <Group>
    <Line points={[0,heightPx/2,tip,0,widthPx,0,widthPx,heightPx,tip,heightPx]} closed stroke={STROKE} strokeWidth={1.25} fill="white"/>
    <Line points={[tip,heightPx/2,widthPx,heightPx/2]} stroke={STROKE} strokeWidth={.65}/>
    <ReferenceText x={tip+2} y={0} width={w-4} height={heightPx/2} text={String(properties.refNum??'1')} size={heightPx*.32}/>
    <ReferenceText x={tip+2} y={heightPx/2} width={w-4} height={heightPx/2} text={String(properties.sheetRef??'A-2')} size={heightPx*.27} bold={false}/>
  </Group>
}

// ─── FLOOR ELEVATION MARKER ───────────────────────────────────────────────────

export function AnnotationFloorElevationRenderer({ widthPx, heightPx, properties }: RendererProps) {
  // Elevation datum line — label on left, hairline spanning right, crosshair tick at right end.
  // Matches the "+24'-8" / 3 btm. joist ─────────────┤" convention used on elevation drawings.
  const elevation   = typeof properties.elevation   === 'string' ? properties.elevation   : "± 0'-0\""
  const description = typeof properties.description === 'string' ? properties.description : ''
  const cy          = heightPx / 2
  const labelW      = widthPx * 0.58
  const lineStartX  = labelW + 5
  const crossH      = Math.min(9, heightPx * 0.65)
  const elevFontSz  = Math.max(1, Math.min(heightPx * .40, labelW / Math.max(1,elevation.length) / .72))
  const descFontSz  = Math.max(1, Math.min(heightPx * .32, labelW / Math.max(1,description.length) / .65))

  return (
    <Group>
      {/* Elevation value — bold, right-aligned to the label column */}
      <Text
        x={0} y={cy - elevFontSz - 1}
        width={labelW} text={elevation}
        fontSize={elevFontSz} fontFamily={ARC_FONT} fontStyle="bold"
        fill={STROKE} align="right" listening={false}
      />
      {/* Floor description below — optional */}
      {description ? (
        <Text
          x={0} y={cy + 2}
          width={labelW} text={description}
          fontSize={descFontSz} fontFamily={ARC_FONT}
          fill={STROKE} align="right" listening={false}
        />
      ) : null}
      {/* Hairline datum extending from label to right edge */}
      <Line points={[lineStartX, cy, widthPx - 4, cy]}
        stroke={STROKE} strokeWidth={0.4} listening={false} />
      {/* Crosshair tick at the right end — vertical through horizontal */}
      <Line points={[widthPx - 4, cy - crossH / 2, widthPx - 4, cy + crossH / 2]}
        stroke={STROKE} strokeWidth={0.9} listening={false} />
      <Line points={[widthPx - 7, cy, widthPx - 1, cy]}
        stroke={STROKE} strokeWidth={0.9} listening={false} />
    </Group>
  )
}

// ─── WORK POINT TARGET ────────────────────────────────────────────────────────

export function AnnotationWorkPointRenderer({widthPx,heightPx}:RendererProps) {
  const cx=widthPx/2,cy=heightPx/2,r=Math.max(1,Math.min(widthPx,heightPx)*.32)
  return <Group>
    <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={1} fill="white"/>
    <Line points={[cx-r*1.45,cy,cx+r*1.45,cy]} stroke={STROKE} strokeWidth={.6}/>
    <Line points={[cx,cy-r*1.45,cx,cy+r*1.45]} stroke={STROKE} strokeWidth={.6}/>
    <Circle x={cx} y={cy} radius={r*.12} fill={STROKE}/>
  </Group>
}

// ─── REVISION DELTA ───────────────────────────────────────────────────────────

export function AnnotationRevisionDeltaRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = typeof properties.label === 'string' ? properties.label : '1'
  const s  = Math.min(widthPx, heightPx)
  const cx = widthPx  / 2
  const cy = heightPx / 2
  const r  = s / 2 - 1
  // Equilateral triangle, with the identifier optically centered below its apex.
  const tipY  = cy - r
  const baseY = cy + r * 0.5
  const baseHW = r * 0.866
  return (
    <Group>
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nc.save()
        nc.beginPath()
        nc.moveTo(cx, tipY)
        nc.lineTo(cx + baseHW, baseY)
        nc.lineTo(cx - baseHW, baseY)
        nc.closePath()
        nc.fillStyle = 'white'; nc.fill()
        nc.strokeStyle = STROKE; nc.lineWidth = 1.4; nc.stroke()
        nc.restore()
      }} listening={false} />
      <Text x={cx - r} y={tipY + (baseY - tipY) * 0.38}
        width={r * 2} height={(baseY - tipY) * 0.5}
        text={label} fontSize={Math.max(6, Math.min(r * 0.72, r * 1.15 / Math.max(1, label.length)))} fill={STROKE}
        fontFamily={ARC_FONT} align="center" verticalAlign="middle" fontStyle="bold" />
    </Group>
  )
}

// ─── 1-HR FIRE RATED WALL ────────────────────────────────────────────────────

export const ANNOTATIONS_RENDERERS: Record<string, RendererComponent> = {
  'annotation-window-tag': ({widthPx:w,heightPx:h,properties}:RendererProps)=><Group>
    <Line points={[w/2,0,w,h/2,w/2,h,0,h/2]} closed fill="white" stroke={STROKE} strokeWidth={1.25}/>
    <ReferenceText x={w*.2} y={h*.25} width={w*.6} height={h*.5} text={String(properties.label||'?')} size={Math.min(w,h)*.3}/>
  </Group>,
  'terrace-edge': TerraceEdgeRenderer,
  'north-arrow': NorthArrowRenderer,
  'fire-rating-label': FireRatingLabelRenderer,
  'text-note': TextNoteRenderer,
  'human-scale': HumanScaleRenderer,
  'annotation-leader': AnnotationLeaderRenderer,
  'annotation-section-cut': AnnotationSectionCutRenderer,
  'annotation-grid-bubble': AnnotationGridBubbleRenderer,
  'annotation-break-line': AnnotationBreakLineRenderer,
  'annotation-elevation-marker': AnnotationElevationMarkerRenderer,
  'annotation-detail-bubble': AnnotationDetailBubbleRenderer,
  'annotation-revision-cloud': AnnotationRevisionCloudRenderer,
  'annotation-elevation-target': AnnotationElevationTargetRenderer,
  'annotation-room-tag': AnnotationRoomTagRenderer,
  'annotation-door-tag': AnnotationDoorTagRenderer,
  'annotation-section-ref': AnnotationSectionRefRenderer,
  'annotation-column-grid-h': AnnotationColumnGridHRenderer,
  'annotation-drawing-title': AnnotationDrawingTitleRenderer,
  'annotation-back-reference': AnnotationBackReferenceRenderer,
  'annotation-floor-elevation': AnnotationFloorElevationRenderer,
  'annotation-work-point': AnnotationWorkPointRenderer,
  'annotation-revision-delta': AnnotationRevisionDeltaRenderer,
  'annotation-slope-arrow': AnnotationSlopeArrowRenderer,
  'annotation-accessible': AnnotationAccessibleRenderer,
}
