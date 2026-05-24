import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { BLOX_DEFINITIONS } from '../blox/definitions'

const WALL_THICKNESS: Record<string, number> = {
  'wall-exterior': 0.5,
  'wall-interior': 0.375,
  'wall-cmu': 0.667,
}

type ActionResult = Record<string, unknown>

async function handleMcpAction(action: string, payload: Record<string, unknown>): Promise<ActionResult> {
  const store = useStore.getState()

  switch (action) {

    case 'list_blox': {
      return {
        blox: BLOX_DEFINITIONS.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          description: d.description,
          defaultWidth: d.defaultWidth,
          defaultHeight: d.defaultHeight,
        }))
      }
    }

    case 'get_project': {
      const { project } = store
      if (!project) return { project: null }
      return {
        project: {
          name: project.name,
          scale: project.scale,
          elements: project.elements.map(el => ({
            id: el.id,
            bloxId: el.bloxId,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            rotation: el.rotation,
          })),
          dimensions: project.dimensions,
        }
      }
    }

    case 'place_element': {
      const { bloxId, x, y, width, height } = payload as {
        bloxId: string; x: number; y: number; width?: number; height?: number
      }
      store.placeElement(bloxId, x, y, width, height)
      const elements = useStore.getState().project?.elements ?? []
      const newEl = elements[elements.length - 1]
      return { success: true, id: newEl?.id ?? null }
    }

    case 'place_wall': {
      const { x1, y1, x2, y2, wallType = 'wall-exterior' } = payload as {
        x1: number; y1: number; x2: number; y2: number; wallType?: string
      }
      const dx = Math.abs(x2 - x1)
      const dy = Math.abs(y2 - y1)
      const t = WALL_THICKNESS[wallType] ?? 0.5
      const isHoriz = dx >= dy
      if (isHoriz) {
        store.placeElement(wallType, Math.min(x1, x2) - t / 2, y1 - t / 2, dx + t, t)
      } else {
        store.placeElement(wallType, x1 - t / 2, Math.min(y1, y2) - t / 2, t, dy + t)
      }
      const elements = useStore.getState().project?.elements ?? []
      const newEl = elements[elements.length - 1]
      return { success: true, id: newEl?.id ?? null }
    }

    case 'update_element': {
      const { id, ...updates } = payload as { id: string; [k: string]: unknown }
      store.updateElement(id, updates as Parameters<typeof store.updateElement>[1])
      return { success: true }
    }

    case 'delete_elements': {
      const { ids } = payload as { ids: string[] }
      store.selectMany(ids, [])
      store.deleteSelectedElements()
      return { success: true, deleted: ids.length }
    }

    case 'add_dimension': {
      const { x1, y1, x2, y2, offset = -1.5 } = payload as {
        x1: number; y1: number; x2: number; y2: number; offset?: number
      }
      store.addDimension({ x1, y1, x2, y2, offset })
      const dims = useStore.getState().project?.dimensions ?? []
      const newDim = dims[dims.length - 1]
      return { success: true, id: newDim?.id ?? null }
    }

    case 'undo': {
      store.undo()
      return { success: true }
    }

    case 'redo': {
      store.redo()
      return { success: true }
    }

    default:
      return { error: `Unknown action: ${action}` }
  }
}

export function useMcpBridge() {
  useEffect(() => {
    if (!window.api?.onMcpAction) return

    window.api.onMcpAction(async ({ requestId, action, payload }) => {
      try {
        const result = await handleMcpAction(action, (payload ?? {}) as Record<string, unknown>)
        window.api.mcpRespond(requestId, result)
      } catch (e) {
        window.api.mcpRespond(requestId, { error: String(e) })
      }
    })
  }, [])
}
