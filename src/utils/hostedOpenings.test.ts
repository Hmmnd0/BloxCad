import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store/useStore'
import { wallSolidRects, hostOpening, positionOpening } from './hostedOpenings'
import { buildProjectSVG } from './svgExport'
import { snapOpeningToWall } from './snap'
import type { PlacedElement } from '../types'

const elements = () => useStore.getState().project!.elements
function setup() {
  useStore.getState().placeElement('wall-interior', 0, 0, 20, 0.5)
  const wall = elements()[0]
  useStore.getState().placeElement('cased-opening', 5, 0, 3, 0.5, wall.id)
  return { wall: elements()[0], opening: elements()[1] }
}
beforeEach(() => useStore.getState().createProject('Hosted opening test', 'quarter'))

describe('hosted opening lifecycle', () => {
  it('moves a selected host and opening atomically with one undo', () => {
    const { wall, opening } = setup()
    const history = useStore.getState().past.length
    useStore.getState().moveElements([
      { id: wall.id, x: 4, y: 2 }, { id: opening.id, x: 9, y: 2 },
    ])
    expect(elements()[1].x).toBe(9)
    expect(elements()[1].wallHost?.offset).toBe(6.5)
    expect(useStore.getState().past).toHaveLength(history + 1)
    useStore.getState().undo()
    expect(elements()[1]).toEqual(opening)
  })
  it('snaps to angled walls with a matching preview rotation', () => {
    const { wall } = setup()
    const angled = { ...wall, rotation: 45 }
    const snap = snapOpeningToWall({ x: 10, y: 0.25 }, [angled], 3, 1)!
    expect(snap.rotation).toBe(45)
    expect(snap.x + snap.widthOverride / 2).toBeCloseTo(10)
    expect(snap.y + snap.heightOverride / 2).toBeCloseTo(0.25)
  })
  it('cuts the wall without changing its identity; deleting the opening heals it', () => {
    const { wall, opening } = setup()
    expect(elements()).toHaveLength(2)
    expect(wall.width).toBe(20)
    expect(opening.wallHost).toEqual({ wallId: wall.id, offset: 6.5 })
    expect(wallSolidRects(wall, elements())).toEqual([
      { x: 0, y: 0, width: 5, height: 0.5 }, { x: 8, y: 0, width: 12, height: 0.5 },
    ])
    useStore.getState().selectMany([opening.id])
    useStore.getState().deleteSelectedElements()
    expect(wallSolidRects(wall, elements())).toEqual([{ x: 0, y: 0, width: 20, height: 0.5 }])
    useStore.getState().undo()
    expect(elements()[1].wallHost).toEqual(opening.wallHost)
    useStore.getState().redo()
    expect(elements()).toHaveLength(1)
  })
  it('tracks wall movement, rotation, and thickness in one undo step', () => {
    const { wall, opening } = setup()
    useStore.getState().updateElement(wall.id, { x: 10, y: 4, height: 0.75, rotation: 90 })
    const moved = elements()[1]
    expect(moved.rotation).toBe(90)
    expect(moved.height).toBe(0.75)
    expect(moved.x + moved.width / 2).toBeCloseTo(20)
    expect(moved.y + moved.height / 2).toBeCloseTo(0.875)
    useStore.getState().undo()
    expect(elements()[1]).toEqual(opening)
  })
  it('slides and resizes an opening while maintaining its host', () => {
    const { wall, opening } = setup()
    useStore.getState().updateElement(opening.id, { x: 10, width: 4 })
    expect(elements()[1].wallHost?.offset).toBe(12)
    expect(wallSolidRects(wall, elements())[0].width).toBe(10)
  })
  it('rejects an undersized wall edit without changing the project or undo history', () => {
    const { wall } = setup()
    const before = useStore.getState()
    expect(() => useStore.getState().updateElement(wall.id, { width: 2 })).toThrow()
    expect(useStore.getState().project).toBe(before.project)
    expect(useStore.getState().past).toBe(before.past)
  })
  it('persists host relationships through JSON save/reload', () => {
    setup()
    const saved = JSON.stringify(useStore.getState().project)
    useStore.getState().loadProject(JSON.parse(saved))
    expect(JSON.stringify(useStore.getState().project!.elements)).toBe(JSON.stringify(JSON.parse(saved).elements))
  })
  it('duplicates hosts with remapped opening references', () => {
    const { wall, opening } = setup()
    useStore.getState().selectMany([wall.id, opening.id])
    useStore.getState().duplicateSelected()
    expect(elements()[3].wallHost?.wallId).toBe(elements()[2].id)
    expect(elements()[3].x).toBeCloseTo(opening.x + 1)
  })
  it('deletes the host and its openings together and restores both on undo', () => {
    const { wall } = setup()
    useStore.getState().selectMany([wall.id])
    useStore.getState().deleteSelectedElements()
    expect(elements()).toHaveLength(0)
    useStore.getState().undo()
    expect(elements()).toHaveLength(2)
  })
  it('unions overlapping cutouts instead of refilling their intersection', () => {
    const { wall } = setup()
    useStore.getState().placeElement('cased-opening', 7, 0, 3, 0.5, wall.id)
    expect(wallSolidRects(wall, elements()).map(r => r.width)).toEqual([5, 10])
  })
  it('exports wall solids instead of a solid rectangle behind the opening', () => {
    setup()
    const svg = buildProjectSVG(useStore.getState().project!)
    // The two solids now share one union path rather than separate rectangles.
    expect(svg).toContain('M0,0 L120,0 L120,12 L0,12 L0,0 Z')
    expect(svg).toContain('M192,0 L480,0 L480,12 L192,12 L192,0 Z')
    expect(svg).not.toContain('M0,0 L480,0 L480,12 L0,12')
  })
  it('supports vertically stored walls and rotated hosts', () => {
    const wall: PlacedElement = { id: 'w', bloxId: 'wall-interior', x: 0, y: 0,
      width: 0.5, height: 20, rotation: 0, properties: {}, locked: false }
    const opening = hostOpening({ ...wall, id: 'o', bloxId: 'cased-opening', y: 5, height: 3 }, wall)
    expect(opening.wallHost?.offset).toBeCloseTo(6.5)
    const turned = positionOpening(opening, { ...wall, rotation: 45 })
    expect(turned.rotation).toBe(45)
    expect(turned.width).toBe(0.5)
    expect(turned.height).toBe(3)
  })
})
