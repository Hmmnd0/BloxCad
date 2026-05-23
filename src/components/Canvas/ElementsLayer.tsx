import React, { useRef, useEffect, useState } from 'react'
import { Layer, Group, Transformer, Rect, Line } from 'react-konva'
import Konva from 'konva'
import { PlacedElement, Tool } from '../../types'
import { RENDERERS } from './renderers'
import { useStore } from '../../store/useStore'
import { snapToGrid } from '../../utils/scale'
import { snapElementEdges, edgeSnapThresholdFt } from '../../utils/snap'

interface ElementsLayerProps {
  pixelsPerFoot: number
  snapFeet: number
  toolActive: Tool
}

interface GroupDragState {
  leaderId: string
  initialPositions: Map<string, { x: number; y: number }>
}

interface SnapGuides { x?: number; y?: number }  // feet

interface BloxGroupProps {
  element: PlacedElement
  pixelsPerFoot: number
  snapFeet: number
  isSelected: boolean
  allSelectedIds: string[]
  toolActive: Tool
  layerRef: React.RefObject<Konva.Layer>
  groupDrag: React.MutableRefObject<GroupDragState | null>
  onSelect: (id: string, multi: boolean) => void
  onMoveMany: (moves: { id: string; x: number; y: number }[]) => void
  onSnapGuide: (guides: SnapGuides) => void
}

function BloxGroup({
  element, pixelsPerFoot, snapFeet, isSelected,
  allSelectedIds, toolActive, layerRef, groupDrag,
  onSelect, onMoveMany, onSnapGuide
}: BloxGroupProps) {
  const altDragOrigin = useRef<{ x: number; y: number } | null>(null)

  const Renderer = RENDERERS[element.bloxId]
  if (!Renderer) return null

  const x = element.x * pixelsPerFoot
  const y = element.y * pixelsPerFoot
  const w = element.width * pixelsPerFoot
  const h = element.height * pixelsPerFoot

  // Group is positioned at its visual center so rotation always pivots around center.
  // node.x()/node.y() == center in pixels; store el.x/el.y == top-left in feet.
  const cx = x + w / 2
  const cy = y + h / 2

  return (
    <Group
      id={element.id}
      x={cx} y={cy}
      offsetX={w / 2} offsetY={h / 2}
      rotation={element.rotation}
      draggable={!element.locked && toolActive !== 'hand'}
      onClick={(e) => {
        // If placing a blox, let the click bubble to the Stage placement handler
        if (useStore.getState().activeBloxId) return
        e.cancelBubble = true
        onSelect(element.id, e.evt.shiftKey || e.evt.metaKey)
      }}
      onTap={(e) => {
        if (useStore.getState().activeBloxId) return
        e.cancelBubble = true
        onSelect(element.id, false)
      }}
      onDragStart={(e) => {
        // Track original position for Option/Alt+drag duplicate
        if (e.evt.altKey) {
          const el = useStore.getState().project?.elements.find(el => el.id === element.id)
          if (el) altDragOrigin.current = { x: el.x, y: el.y }
        } else {
          altDragOrigin.current = null
        }
        // Become the group leader — record start positions for all selected elements
        if (!isSelected) return
        const map = new Map<string, { x: number; y: number }>()
        allSelectedIds.forEach(selId => {
          const node = layerRef.current?.findOne(`#${selId}`) as Konva.Group | undefined
          if (node) map.set(selId, { x: node.x(), y: node.y() })
        })
        groupDrag.current = { leaderId: element.id, initialPositions: map }
      }}
      onDragMove={(e) => {
        const node = e.target as Konva.Group
        const stageScale = node.getStage()?.scaleX() ?? 1

        const el = useStore.getState().project?.elements.find(e => e.id === element.id)
        const halfW = el ? (el.width  * pixelsPerFoot) / 2 : w / 2
        const halfH = el ? (el.height * pixelsPerFoot) / 2 : h / 2
        const elW = el?.width  ?? element.width
        const elH = el?.height ?? element.height

        // Current top-left in feet
        const tlXft = (node.x() - halfW) / pixelsPerFoot
        const tlYft = (node.y() - halfH) / pixelsPerFoot

        // Edge-snap against all other elements
        const allElements = useStore.getState().project?.elements ?? []
        const threshold = edgeSnapThresholdFt(pixelsPerFoot, stageScale, 20)
        const snap = snapElementEdges(
          { x: tlXft, y: tlYft, width: elW, height: elH },
          allElements, threshold, element.id
        )

        // Use edge snap per-axis; fall back to grid snap on un-snapped axes
        const finalTlX = snap.snapX
          ? snap.x * pixelsPerFoot
          : snapToGrid(tlXft, snapFeet) * pixelsPerFoot
        const finalTlY = snap.snapY
          ? snap.y * pixelsPerFoot
          : snapToGrid(tlYft, snapFeet) * pixelsPerFoot

        node.x(finalTlX + halfW)
        node.y(finalTlY + halfH)

        // Emit guide lines
        onSnapGuide({
          x: snap.snapX ? snap.guideX : undefined,
          y: snap.snapY ? snap.guideY : undefined
        })

        // If leading a group drag, move all other selected siblings
        const state = groupDrag.current
        if (!state || state.leaderId !== element.id) return
        const leaderStart = state.initialPositions.get(element.id)
        if (!leaderStart) return

        const dx = (finalTlX + halfW) - leaderStart.x
        const dy = (finalTlY + halfH) - leaderStart.y

        allSelectedIds.forEach(selId => {
          if (selId === element.id) return
          const sibling = layerRef.current?.findOne(`#${selId}`) as Konva.Group | undefined
          const sibStart = state.initialPositions.get(selId)
          if (sibling && sibStart) {
            sibling.x(sibStart.x + dx)
            sibling.y(sibStart.y + dy)
          }
        })
      }}
      onDragEnd={() => {
        const state = groupDrag.current
        const moves: { id: string; x: number; y: number }[] = []
        const allElements = useStore.getState().project?.elements ?? []

        if (state && state.leaderId === element.id && allSelectedIds.length > 1) {
          // Commit all group members — node.x()/y() is center, convert to top-left
          allSelectedIds.forEach(selId => {
            const node = layerRef.current?.findOne(`#${selId}`) as Konva.Group | undefined
            const elData = allElements.find(e => e.id === selId)
            if (node && elData) {
              moves.push({
                id: selId,
                x: node.x() / pixelsPerFoot - elData.width  / 2,
                y: node.y() / pixelsPerFoot - elData.height / 2
              })
            }
          })
          groupDrag.current = null
        } else {
          // Single element move
          const node = layerRef.current?.findOne(`#${element.id}`) as Konva.Group | undefined
          if (node) {
            moves.push({
              id: element.id,
              x: node.x() / pixelsPerFoot - element.width  / 2,
              y: node.y() / pixelsPerFoot - element.height / 2
            })
          }
        }

        if (moves.length) onMoveMany(moves)
        onSnapGuide({})

        // Option/Alt+drag: place a copy at the original position (Illustrator-style)
        if (altDragOrigin.current && moves.length === 1) {
          const { x: origX, y: origY } = altDragOrigin.current
          useStore.getState().cloneElementAt(element.id, origX, origY)
          altDragOrigin.current = null
        }
      }}
    >
      {isSelected && (
        <Rect
          x={-2} y={-2}
          width={w + 4} height={h + 4}
          stroke="#4F9EFF" strokeWidth={2}
          fill="rgba(79,158,255,0.06)"
          listening={false}
        />
      )}
      <Group
        x={(element.properties.flipH ? w : 0)}
        scaleX={(element.properties.flipH ? -1 : 1)}
        y={(element.properties.flipV ? h : 0)}
        scaleY={(element.properties.flipV ? -1 : 1)}
      >
        <Renderer
          widthPx={w}
          heightPx={h}
          selected={isSelected}
          properties={element.properties}
        />
      </Group>
    </Group>
  )
}

export function ElementsLayer({ pixelsPerFoot, snapFeet, toolActive }: ElementsLayerProps) {
  const { project, selectedElementIds, selectElement, updateElement } = useStore()
  const transformerRef = useRef<Konva.Transformer>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const groupDrag = useRef<GroupDragState | null>(null)
  const [snapGuides, setSnapGuides] = useState<SnapGuides>({})

  const layers = project?.layers ?? []
  const hiddenLayerIds = new Set(layers.filter(l => !l.visible).map(l => l.id))
  const lockedLayerIds = new Set(layers.filter(l => l.locked).map(l => l.id))

  const elements = (project?.elements ?? []).filter(el => !hiddenLayerIds.has(el.layerId ?? ''))

  // Keep transformer in sync with selection
  useEffect(() => {
    if (!transformerRef.current || !layerRef.current) return
    const transformer = transformerRef.current
    const selectedNodes = selectedElementIds
      .map(id => layerRef.current?.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[]
    transformer.nodes(selectedNodes)
    transformer.getLayer()?.batchDraw()
  }, [selectedElementIds])

  const handleMoveMany = (moves: { id: string; x: number; y: number }[]) => {
    moves.forEach(({ id, x, y }) => updateElement(id, { x, y }))
  }

  return (
    <Layer ref={layerRef}>
      {elements.map(el => (
        <BloxGroup
          key={el.id}
          element={{ ...el, locked: el.locked || lockedLayerIds.has(el.layerId ?? '') }}
          pixelsPerFoot={pixelsPerFoot}
          snapFeet={snapFeet}
          isSelected={selectedElementIds.includes(el.id)}
          allSelectedIds={selectedElementIds}
          toolActive={toolActive}
          layerRef={layerRef}
          groupDrag={groupDrag}
          onSelect={(id, multi) => selectElement(id, multi)}
          onMoveMany={handleMoveMany}
          onSnapGuide={setSnapGuides}
        />
      ))}
      <Transformer
        ref={transformerRef}
        borderStroke="#4F9EFF"
        borderStrokeWidth={1.5}
        anchorStroke="#4F9EFF"
        anchorFill="white"
        anchorSize={8}
        anchorCornerRadius={2}
        rotateEnabled={true}
        keepRatio={false}
        onTransform={() => {
          // Guides only — actual snapping is handled by boundBoxFunc
          const nodes = transformerRef.current?.nodes() ?? []
          const allEls = project?.elements ?? []
          let guideX: number | undefined, guideY: number | undefined
          nodes.forEach(node => {
            const id = node.id()
            const el = allEls.find(e => e.id === id)
            if (!el) return
            const stageScale = node.getStage()?.scaleX() ?? 1
            const threshold = edgeSnapThresholdFt(pixelsPerFoot, stageScale, 20)
            const cx = node.x() / pixelsPerFoot
            const cy = node.y() / pixelsPerFoot
            const scaledW = el.width  * node.scaleX()
            const scaledH = el.height * node.scaleY()
            const snap = snapElementEdges(
              { x: cx - scaledW / 2, y: cy - scaledH / 2, width: scaledW, height: scaledH },
              allEls, threshold, id
            )
            if (snap.snapX) guideX = snap.guideX
            if (snap.snapY) guideY = snap.guideY
          })
          setSnapGuides({ x: guideX, y: guideY })
        }}
        boundBoxFunc={(oldBox, newBox) => {
          // Snap resize handles to other elements' edges.
          // boundBoxFunc boxes are in stage/layer pixel coords (feet × pixelsPerFoot).
          const stageScale = transformerRef.current?.getStage()?.scaleX() ?? 1
          const threshPx = 20 / stageScale  // 20 screen pixels in stage coords
          const allEls = project?.elements ?? []
          const selectedIds = new Set(selectedElementIds)

          const oldRight  = oldBox.x + oldBox.width
          const oldBottom = oldBox.y + oldBox.height

          // Detect which edges are fixed vs moving (epsilon = 0.5 stage px)
          const leftFixed   = Math.abs(newBox.x - oldBox.x) < 0.5
          const topFixed    = Math.abs(newBox.y - oldBox.y) < 0.5
          const rightFixed  = Math.abs((newBox.x + newBox.width)  - oldRight)  < 0.5
          const bottomFixed = Math.abs((newBox.y + newBox.height) - oldBottom) < 0.5

          let { x, y, width, height } = newBox

          for (const el of allEls) {
            if (selectedIds.has(el.id)) continue
            const oLeft   = el.x * pixelsPerFoot
            const oRight  = (el.x + el.width)  * pixelsPerFoot
            const oTop    = el.y * pixelsPerFoot
            const oBottom = (el.y + el.height) * pixelsPerFoot

            if (!leftFixed) {
              for (const target of [oLeft, oRight]) {
                if (Math.abs(x - target) < threshPx) {
                  const fixedRight = x + width
                  x = target
                  width = Math.max(1, fixedRight - target)
                }
              }
            }
            if (!rightFixed) {
              const curRight = x + width
              for (const target of [oLeft, oRight]) {
                if (Math.abs(curRight - target) < threshPx) {
                  width = Math.max(1, target - x)
                }
              }
            }
            if (!topFixed) {
              for (const target of [oTop, oBottom]) {
                if (Math.abs(y - target) < threshPx) {
                  const fixedBottom = y + height
                  y = target
                  height = Math.max(1, fixedBottom - target)
                }
              }
            }
            if (!bottomFixed) {
              const curBottom = y + height
              for (const target of [oTop, oBottom]) {
                if (Math.abs(curBottom - target) < threshPx) {
                  height = Math.max(1, target - y)
                }
              }
            }
          }

          return { ...newBox, x, y, width, height }
        }}
        onTransformEnd={() => {
          setSnapGuides({})
          const nodes = transformerRef.current?.nodes() ?? []
          nodes.forEach(node => {
            const id = node.id()
            const el = elements.find(e => e.id === id)
            if (!el) return

            const scaledW = Math.max(0.1, el.width  * node.scaleX())
            const scaledH = Math.max(0.1, el.height * node.scaleY())
            node.scaleX(1)
            node.scaleY(1)

            const rawRot = ((node.rotation() % 360) + 360) % 360
            const is90  = Math.abs(rawRot - 90)  < 20
            const is270 = Math.abs(rawRot - 270) < 20

            // node.x()/y() is already the visual center (offsetX/offsetY applied)
            const cx = node.x() / pixelsPerFoot
            const cy = node.y() / pixelsPerFoot

            // Auto-recalculate step/pane count on resize
            const newProps = el.bloxId === 'stairs-elevation'
              ? { ...el.properties, stepCount: Math.max(3, Math.min(24, Math.round(scaledW / (11 / 12)))) }
              : el.bloxId === 'window-multi'
              ? { ...el.properties, paneCount: Math.max(1, Math.min(12, Math.round((is90 || is270 ? scaledH : scaledW) / 2))) }
              : el.properties

            if (is90 || is270) {
              // Normalize: swap W↔H, reset rotation=0
              const newW = scaledH
              const newH = scaledW
              node.rotation(0)
              node.offsetX(newW / 2 * pixelsPerFoot)
              node.offsetY(newH / 2 * pixelsPerFoot)
              node.x(cx * pixelsPerFoot)
              node.y(cy * pixelsPerFoot)
              updateElement(id, { x: cx - newW / 2, y: cy - newH / 2, width: newW, height: newH, rotation: 0, properties: newProps })
            } else {
              updateElement(id, {
                x: cx - scaledW / 2,
                y: cy - scaledH / 2,
                width: scaledW,
                height: scaledH,
                rotation: rawRot,
                properties: newProps
              })
            }
          })
        }}
      />

      {/* Alignment guide lines — shown during drag and resize */}
      {snapGuides.x !== undefined && (
        <Line
          points={[snapGuides.x * pixelsPerFoot, -50000, snapGuides.x * pixelsPerFoot, 50000]}
          stroke="#FF45C8"
          strokeWidth={1}
          dash={[6, 3]}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {snapGuides.y !== undefined && (
        <Line
          points={[-50000, snapGuides.y * pixelsPerFoot, 50000, snapGuides.y * pixelsPerFoot]}
          stroke="#FF45C8"
          strokeWidth={1}
          dash={[6, 3]}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
    </Layer>
  )
}
