import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store/useStore'
import { wallEndpoints } from './wallJunctions'

beforeEach(() => useStore.getState().createProject('Corners', 'quarter'))
const elements = () => useStore.getState().project!.elements
function setup() {
  const s = useStore.getState()
  // Padded centerlines (0,0)–(10,0) and (10,0)–(10,10).
  s.placeElement('wall-interior', -0.25, -0.25, 10.5, 0.5)
  s.placeElement('wall-interior', 9.75, -0.25, 0.5, 10.5)
  return elements()
}
describe('connected corner editing', () => {
  it('moves a shared corner, keeps opposite ends fixed, and preserves IDs', () => {
    const [a, b] = setup()
    expect(useStore.getState().moveWallCorner(a.id, 'end', { x: 12, y: 2 })).toBeNull()
    const [aa, bb] = elements().map(wallEndpoints)
    expect(aa.end.x).toBeCloseTo(12); expect(aa.end.y).toBeCloseTo(2)
    expect(bb.start.x).toBeCloseTo(12); expect(bb.start.y).toBeCloseTo(2)
    expect(aa.start.x).toBeCloseTo(0); expect(aa.start.y).toBeCloseTo(0)
    expect(bb.end.x).toBeCloseTo(10); expect(bb.end.y).toBeCloseTo(10)
    expect(elements().map(w => w.id)).toEqual([a.id, b.id])
  })
  it('persists repeat edits and undoes the whole junction in one step', () => {
    const [a] = setup()
    const original = elements()
    useStore.getState().moveWallCorner(a.id, 'end', { x: 12, y: 2 })
    const moved = elements()
    useStore.getState().loadProject(JSON.parse(JSON.stringify(useStore.getState().project)))
    useStore.getState().moveWallCorner(a.id, 'end', { x: 8, y: 1 })
    expect(wallEndpoints(elements()[1]).start.x).toBeCloseTo(8)
    useStore.getState().undo()
    expect(elements()).toEqual(moved)
    // Saving/reloading intentionally starts a new history.
    expect(original[0].width).toBe(10.5)
  })
  it('moves hosted openings with the junction and restores everything on undo/redo', () => {
    const [a] = setup()
    useStore.getState().placeElement('cased-opening', 3, -0.25, 3, 0.5, a.id)
    const original = elements()
    useStore.getState().moveWallCorner(a.id, 'end', { x: 12, y: 2 })
    expect(elements()[2].rotation).toBe(elements()[0].rotation)
    expect(elements()[2].wallHost?.wallId).toBe(a.id)
    useStore.getState().undo(); expect(elements()).toEqual(original)
    useStore.getState().redo(); expect(elements()[2].rotation).not.toBe(0)
  })
  it('rejects a locked neighbor without partially moving the source', () => {
    const [a, b] = setup()
    useStore.getState().updateElement(b.id, { locked: true })
    const before = useStore.getState()
    expect(useStore.getState().moveWallCorner(a.id, 'end', { x: 12, y: 2 })).toContain('Unlock')
    expect(useStore.getState().project).toBe(before.project)
    expect(useStore.getState().past).toBe(before.past)
  })
  it('rejects a wall too short for its opening', () => {
    const [a] = setup()
    useStore.getState().placeElement('cased-opening', 3, -0.25, 3, 0.5, a.id)
    const before = elements()
    expect(useStore.getState().moveWallCorner(a.id, 'end', { x: 1, y: 0 })).toContain('Opening')
    expect(elements()).toBe(before)
  })
  it('does not join a nearby but disconnected wall', () => {
    const [a, b] = setup()
    useStore.getState().updateElement(b.id, { x: 9.85 })
    const before = elements()[1]
    useStore.getState().moveWallCorner(a.id, 'end', { x: 12, y: 2 })
    expect(elements()[1]).toBe(before)
  })
  it('ignores no-op drags without adding undo entries', () => {
    const [a] = setup()
    const before = useStore.getState().past
    useStore.getState().moveWallCorner(a.id, 'end', { x: 10, y: 0 })
    expect(useStore.getState().past).toBe(before)
  })
})
