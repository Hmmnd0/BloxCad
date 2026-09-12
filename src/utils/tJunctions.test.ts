import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store/useStore'
import { followTJunctions, wallEndpoints } from './wallJunctions'

beforeEach(() => useStore.getState().createProject('T junctions', 'quarter'))
const elements = () => useStore.getState().project!.elements
function setup() {
  const s = useStore.getState()
  s.placeElement('wall-interior', -0.25, -0.25, 10.5, 0.5)
  s.placeElement('wall-interior', 4.75, -0.25, 0.5, 8.5)
  return elements()
}
describe('T-junction corner edits', () => {
  it('keeps a partition at its fractional attachment on a changing host', () => {
    const [host] = setup()
    expect(useStore.getState().moveWallCorner(host.id, 'end', { x: 12, y: 2 })).toBeNull()
    const branch = wallEndpoints(elements()[1])
    expect(branch.start.x).toBeCloseTo(6); expect(branch.start.y).toBeCloseTo(1)
    expect(branch.end.x).toBeCloseTo(5); expect(branch.end.y).toBeCloseTo(8)
  })
  it('moves attached openings and undoes the entire operation', () => {
    const [host, branch] = setup()
    useStore.getState().placeElement('cased-opening', 4.75, 3, 0.5, 3, branch.id)
    const original = elements()
    expect(useStore.getState().moveWallCorner(host.id, 'end', { x: 12, y: 2 })).toBeNull()
    expect(elements()[2].rotation).toBe(elements()[1].rotation)
    useStore.getState().undo(); expect(elements()).toEqual(original)
    useStore.getState().redo(); expect(wallEndpoints(elements()[1]).start.x).toBeCloseTo(6)
  })
  it('rejects locked partitions atomically', () => {
    const [host, branch] = setup()
    useStore.getState().updateElement(branch.id, { locked: true })
    const before = useStore.getState()
    expect(useStore.getState().moveWallCorner(host.id, 'end', { x: 12, y: 2 })).toContain('Unlock')
    expect(useStore.getState().project).toBe(before.project)
    expect(useStore.getState().past).toBe(before.past)
  })
  it('does not mistake a near miss for an attachment', () => {
    const [host, branch] = setup()
    useStore.getState().updateElement(branch.id, { y: -0.2 })
    const before = elements()[1]
    useStore.getState().moveWallCorner(host.id, 'end', { x: 12, y: 2 })
    expect(elements()[1]).toBe(before)
  })
  it('propagates chained partitions', () => {
    const [host] = setup()
    useStore.getState().placeElement('wall-interior', 4.75, 3.75, 5.5, 0.5)
    expect(useStore.getState().moveWallCorner(host.id, 'end', { x: 12, y: 2 })).toBeNull()
    const child = wallEndpoints(elements()[2])
    expect(child.start.x).toBeCloseTo(5.5); expect(child.start.y).toBeCloseTo(4.5)
    expect(child.end.x).toBeCloseTo(10)
  })
  it('does not silently detach a branch endpoint dragged off its host', () => {
    const [, branch] = setup()
    expect(useStore.getState().moveWallCorner(branch.id, 'start', { x: 6, y: 1 })).toContain('attached')
  })
  it('supports whole-host translation in the geometry helper', () => {
    const old = setup()
    const next = followTJunctions(old, old.map((w, i) => i ? w : { ...w, y: w.y + 2 }), [])
    expect(wallEndpoints(next[1]).start.y).toBeCloseTo(2)
    expect(wallEndpoints(next[1]).end.y).toBeCloseTo(8)
  })
})
