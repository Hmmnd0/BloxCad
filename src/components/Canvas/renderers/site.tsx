import React from 'react'
import { refinedSite } from './RefinedSite'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'

export function SiteTreeRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2
  const cy = heightPx / 2
  const r = Math.min(widthPx, heightPx) / 2
  // Deterministic varied branch lengths so the symbol reads hand-drawn
  const branches = 12
  const lengths = [0.95, 0.72, 0.88, 0.65, 0.92, 0.78, 0.85, 0.7, 0.9, 0.75, 0.82, 0.68]
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={STROKE_MED} />
      {Array.from({ length: branches }, (_, i) => {
        const a = (i / branches) * Math.PI * 2 + 0.26
        const len = r * lengths[i % lengths.length]
        return (
          <Line
            key={i}
            points={[cx + Math.cos(a) * r * 0.12, cy + Math.sin(a) * r * 0.12,
                     cx + Math.cos(a) * len, cy + Math.sin(a) * len]}
            stroke={STROKE} strokeWidth={STROKE_THIN}
          />
        )
      })}
      <Circle x={cx} y={cy} radius={Math.max(1.5, r * 0.06)} fill={STROKE} />
    </Group>
  )
}

export function SiteShrubRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Shape
      sceneFunc={(ctx, shape) => {
        const cx = widthPx / 2
        const cy = heightPx / 2
        const r = Math.min(widthPx, heightPx) / 2
        const bumps = 10
        ctx.beginPath()
        for (let i = 0; i < bumps; i++) {
          const a0 = (i / bumps) * Math.PI * 2
          const a1 = ((i + 1) / bumps) * Math.PI * 2
          const am = (a0 + a1) / 2
          const x0 = cx + Math.cos(a0) * r * 0.85
          const y0 = cy + Math.sin(a0) * r * 0.85
          const xm = cx + Math.cos(am) * r * 1.0
          const ym = cy + Math.sin(am) * r * 1.0
          const x1 = cx + Math.cos(a1) * r * 0.85
          const y1 = cy + Math.sin(a1) * r * 0.85
          if (i === 0) ctx.moveTo(x0, y0)
          ctx.quadraticCurveTo(xm, ym, x1, y1)
        }
        ctx.closePath()
        ctx.fillStrokeShape(shape)
      }}
      stroke={STROKE} strokeWidth={STROKE_THIN}
    />
  )
}

export function SiteParkingStallRenderer({ widthPx, heightPx }: RendererProps) {
  const ppf = useStore(getPixelsPerFoot)
  const stallFt = 9
  const stripes: number[] = []
  for (let x = stallFt * ppf; x < widthPx - 1; x += stallFt * ppf) stripes.push(x)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} stroke={STROKE} strokeWidth={STROKE_MED} />
      {stripes.map((x, i) => (
        <Line key={i} points={[x, 0, x, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      ))}
    </Group>
  )
}

const LINE_TYPE_LABEL: Record<string, string> = { front: 'FRONT', side: 'SIDE', rear: 'REAR' }

// Clamps a user-provided properties.fontSize (world px, true-to-scale — same
// convention as text-note/annotation-leader) to a sane range, falling back to def.
function clampFont(v: unknown, def: number): number {
  return typeof v === 'number' ? Math.max(5, Math.min(24, v)) : def
}

export function SitePropertyLineRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const ppf = useStore(getPixelsPerFoot)
  const cy = heightPx / 2
  const lengthFt = widthPx / ppf
  const bearing = typeof properties.bearing === 'string' ? properties.bearing.trim() : ''
  const lineType = typeof properties.lineType === 'string' ? LINE_TYPE_LABEL[properties.lineType] : undefined
  const dimLabel = bearing ? `${bearing}  ${lengthFt.toFixed(2)}'` : `${lengthFt.toFixed(2)}'`
  const fontSize = clampFont(properties.fontSize, 9)
  return (
    <Group>
      <Line
        points={[0, cy, widthPx, cy]}
        stroke={STROKE} strokeWidth={STROKE_HEAVY}
        dash={[16, 5, 3, 5]}
      />
      <Text
        x={widthPx / 2 - 12} y={cy - fontSize - 4} width={24}
        text="PL" fontSize={fontSize} fill={STROKE} fontFamily={ARC_FONT} align="center"
      />
      {/* Bearing + distance — surveyor convention, decimal feet */}
      <Text
        x={0} y={cy + 4} width={widthPx}
        text={dimLabel} fontSize={Math.max(6, fontSize - 1)} fill="#555" fontFamily={ARC_FONT} align="center"
      />
      {/* Front/side/rear role tag, offset toward one end so it doesn't collide with "PL" */}
      {lineType && (
        <Text
          x={4} y={cy - fontSize - 13} width={60}
          text={lineType} fontSize={Math.max(6, fontSize - 2)} fill="#777" fontFamily={ARC_FONT}
          letterSpacing={0.6}
        />
      )}
    </Group>
  )
}

const SETBACK_COLOR = '#3A6EA5'

export function SiteSetbackLineRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const cy = heightPx / 2
  const setbackFt = typeof properties.setbackFt === 'number' ? properties.setbackFt : 10
  const fontSize = clampFont(properties.fontSize, 8)
  const label = `${setbackFt}' SETBACK`
  const labelW = Math.max(40, label.length * fontSize * 0.68 + 8)
  const gap0 = widthPx / 2 - labelW / 2
  const gap1 = widthPx / 2 + labelW / 2
  return (
    <Group>
      <Line points={[0, cy, gap0, cy]} stroke={SETBACK_COLOR} strokeWidth={STROKE_THIN} dash={[4, 4]} />
      <Line points={[gap1, cy, widthPx, cy]} stroke={SETBACK_COLOR} strokeWidth={STROKE_THIN} dash={[4, 4]} />
      <Text
        x={gap0} y={cy - fontSize * 0.65} width={labelW}
        text={label} fontSize={fontSize} fill={SETBACK_COLOR} fontFamily={ARC_FONT} align="center"
      />
    </Group>
  )
}

const EASEMENT_TYPE_LABEL: Record<string, string> = {
  utility: 'UTILITY', drainage: 'DRAINAGE', access: 'ACCESS', sewer: 'SEWER',
}

export function SiteEasementRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const ppf = useStore(getPixelsPerFoot)
  const type = typeof properties.easementType === 'string' ? properties.easementType : 'utility'
  const typeLabel = EASEMENT_TYPE_LABEL[type] ?? type.toUpperCase()
  const widthFt = heightPx / ppf
  const fontSize = clampFont(properties.fontSize, 8)
  const label = `${widthFt.toFixed(0)}' ${typeLabel} ESMT`
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="rgba(58,110,165,0.08)" stroke={SETBACK_COLOR} strokeWidth={STROKE_THIN} dash={[6, 4]} />
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.strokeStyle = 'rgba(58,110,165,0.35)'
          nctx.lineWidth = 0.6
          const step = 10
          for (let x = -heightPx; x < widthPx; x += step) {
            nctx.beginPath()
            nctx.moveTo(x, heightPx)
            nctx.lineTo(x + heightPx, 0)
            nctx.stroke()
          }
          nctx.restore()
        }}
        listening={false}
      />
      <Text
        x={0} y={heightPx / 2 - fontSize * 0.65} width={widthPx}
        text={label} fontSize={fontSize} fill={SETBACK_COLOR} fontFamily={ARC_FONT} align="center"
      />
    </Group>
  )
}

export function SiteSidewalkRenderer({ widthPx, heightPx }: RendererProps) {
  const ppf = useStore(getPixelsPerFoot)
  const jointFt = 5
  const joints: number[] = []
  for (let x = jointFt * ppf; x < widthPx - 1; x += jointFt * ppf) joints.push(x)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} stroke={STROKE} strokeWidth={STROKE_THIN} />
      {joints.map((x, i) => (
        <Line key={i} points={[x, 0, x, heightPx]} stroke="#999" strokeWidth={STROKE_THIN} />
      ))}
      {/* Sparse deterministic stipple for concrete texture */}
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.fillStyle = '#AAA'
          const count = Math.floor((widthPx * heightPx) / 220)
          for (let i = 0; i < count; i++) {
            const fx = Math.sin(i * 12.9898) * 43758.5453
            const fy = Math.sin(i * 78.233) * 12543.897
            const px = (fx - Math.floor(fx)) * widthPx
            const py = (fy - Math.floor(fy)) * heightPx
            nctx.fillRect(px, py, 0.8, 0.8)
          }
          nctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

export function SiteContourRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = typeof properties.elevLabel === 'string' ? properties.elevLabel : '100'
  const fontSize = clampFont(properties.fontSize, 9)
  const cy = heightPx / 2
  const amp = heightPx * 0.3
  const labelW = Math.max(22, label.length * fontSize * 0.68 + 8)
  const gap0 = widthPx / 2 - labelW / 2
  const gap1 = widthPx / 2 + labelW / 2
  const waveSeg = (x0: number, x1: number) => (ctx: import('konva/lib/Context').Context, shape: import('konva/lib/Shape').Shape) => {
    ctx.beginPath()
    ctx.moveTo(x0, cy + Math.sin((x0 / widthPx) * Math.PI * 4) * amp)
    for (let x = x0 + 2; x <= x1; x += 2) {
      ctx.lineTo(x, cy + Math.sin((x / widthPx) * Math.PI * 4) * amp)
    }
    ctx.strokeShape(shape)
  }
  return (
    <Group>
      <Shape sceneFunc={waveSeg(0, gap0)} stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Shape sceneFunc={waveSeg(gap1, widthPx)} stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Text
        x={gap0} y={cy - fontSize * 0.55} width={labelW}
        text={label} fontSize={fontSize} fill={STROKE} fontFamily={ARC_FONT} align="center"
      />
    </Group>
  )
}

// ─── BAY WINDOW ──────────────────────────────────────────────────────────────

export function SiteDrivewayRenderer({ widthPx, heightPx }: RendererProps) {
  const ppf = useStore(getPixelsPerFoot)
  const jointFt = 8
  const joints: number[] = []
  for (let x = jointFt * ppf; x < widthPx - 1; x += jointFt * ppf) joints.push(x)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#DCDCDC" stroke={STROKE} strokeWidth={STROKE_THIN} />
      {joints.map((x, i) => (
        <Line key={i} points={[x, 0, x, heightPx]} stroke="#999" strokeWidth={STROKE_THIN} />
      ))}
    </Group>
  )
}

export function SiteFenceRenderer({ widthPx, heightPx }: RendererProps) {
  const ppf = useStore(getPixelsPerFoot)
  const cy = heightPx / 2
  const postFt = 8
  const posts: number[] = [0]
  for (let x = postFt * ppf; x < widthPx; x += postFt * ppf) posts.push(x)
  posts.push(widthPx)
  return (
    <Group>
      <Line points={[0, cy, widthPx, cy]} stroke={STROKE} strokeWidth={STROKE_MED} />
      {posts.map((x, i) => (
        <Line key={i} points={[x, cy - 4, x, cy + 4]} stroke={STROKE} strokeWidth={STROKE_MED} />
      ))}
    </Group>
  )
}

export function SiteRetainingWallRenderer({ widthPx, heightPx }: RendererProps) {
  const fontSize = clampFont(undefined, 7)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#8B8378" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath(); nctx.rect(0, 0, widthPx, heightPx); nctx.clip()
          nctx.strokeStyle = 'rgba(0,0,0,0.25)'; nctx.lineWidth = 0.5
          const step = Math.max(4, heightPx / 2)
          for (let x = -heightPx; x < widthPx + heightPx; x += step) {
            nctx.beginPath(); nctx.moveTo(x, 0); nctx.lineTo(x + heightPx, heightPx); nctx.stroke()
          }
          nctx.restore()
        }}
        listening={false}
      />
      <Text x={0} y={heightPx / 2 - fontSize / 2} width={widthPx} text="RET WALL"
        fontSize={fontSize} fill="white" fontFamily={ARC_FONT} align="center" listening={false} />
    </Group>
  )
}

export function SiteDeckPatioRenderer({ widthPx, heightPx }: RendererProps) {
  const ppf = useStore(getPixelsPerFoot)
  const boardFt = 0.5
  const boards: number[] = []
  for (let y = boardFt * ppf; y < heightPx - 1; y += boardFt * ppf) boards.push(y)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#E8DCC8" stroke={STROKE} strokeWidth={STROKE_THIN} />
      {boards.map((y, i) => (
        <Line key={i} points={[0, y, widthPx, y]} stroke="#B8A888" strokeWidth={STROKE_THIN} />
      ))}
    </Group>
  )
}

// "SS" (sanitary sewer) rather than bare "S" — standard civil-plan labeling,
// since "S" alone is ambiguous with storm sewer on an actual site plan.
const UTILITY_LINE_STYLE: Record<string, { color: string; label: string }> = {
  water: { color: '#2A5FA5', label: 'W' },
  sewer: { color: '#6B4423', label: 'SS' },
  gas: { color: '#B8860B', label: 'G' },
}

function UtilityLineRenderer(kind: 'water' | 'sewer' | 'gas') {
  return function ({ widthPx, heightPx, properties }: RendererProps) {
    const ppf = useStore(getPixelsPerFoot)
    const { color, label } = UTILITY_LINE_STYLE[kind]
    const cy = heightPx / 2
    const lengthFt = widthPx / ppf
    const fontSize = clampFont(properties.fontSize, 8)
    return (
      <Group>
        <Line points={[0, cy, widthPx, cy]} stroke={color} strokeWidth={STROKE_MED} dash={[10, 4]} />
        <Text x={widthPx / 2 - 20} y={cy - fontSize - 3} width={40} align="center"
          text={`${label} — ${lengthFt.toFixed(0)}'`} fontSize={fontSize} fill={color} fontFamily={ARC_FONT} />
      </Group>
    )
  }
}

export const SiteWaterServiceRenderer = UtilityLineRenderer('water')
export const SiteSewerLateralRenderer = UtilityLineRenderer('sewer')
export const SiteGasServiceRenderer = UtilityLineRenderer('gas')

export function SiteElectricalServiceRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  const fontSize = clampFont(undefined, 6)
  return (
    <Group>
      <Line points={[cx, cy - r, cx + r * 0.87, cy + r * 0.5, cx - r * 0.87, cy + r * 0.5]}
        closed fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Text x={0} y={cy + r + 2} width={widthPx} align="center" text="ELEC"
        fontSize={fontSize} fill={STROKE} fontFamily={ARC_FONT} listening={false} />
    </Group>
  )
}

export const SITE_RENDERERS: Record<string, RendererComponent> = {
  'site-tree': refinedSite('site-tree'),
  'site-shrub': refinedSite('site-shrub'),
  'site-parking-stall': refinedSite('site-parking-stall'),
  'site-property-line': refinedSite('site-property-line'),
  'site-setback-line': refinedSite('site-setback-line'),
  'site-easement': refinedSite('site-easement'),
  'site-sidewalk': refinedSite('site-sidewalk'),
  'site-contour': refinedSite('site-contour'),
  'site-driveway': refinedSite('site-driveway'),
  'site-fence': refinedSite('site-fence'),
  'site-retaining-wall': refinedSite('site-retaining-wall'),
  'site-deck-patio': refinedSite('site-deck-patio'),
  'site-water-service': refinedSite('site-water-service'),
  'site-sewer-lateral': refinedSite('site-sewer-lateral'),
  'site-gas-service': refinedSite('site-gas-service'),
  'site-electrical-service': refinedSite('site-electrical-service'),
}
