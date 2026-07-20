import { describe, it, expect } from 'vitest'
import { detectRooms } from './roomDetect'
import type { PlacedElement } from '../types'

function mk(id: string, bloxId: string, x: number, y: number, width: number, height: number, properties: Record<string, unknown> = {}): PlacedElement {
  return { id, bloxId, x, y, width, height, rotation: 0, properties, locked: false }
}

describe('detectRooms', () => {
  it('returns an empty array when there are no room tags', () => {
    const elements = [mk('w', 'wall-exterior', 0, 0, 10, 0.5)]
    expect(detectRooms(elements)).toEqual([])
  })

  it('computes interior bounds for a single walled room from a centered tag', () => {
    const elements = [
      mk('top',    'wall-exterior', 0, 0, 10.5, 0.5),
      mk('right',  'wall-exterior', 10, 0, 0.5, 10.5),
      mk('bottom', 'wall-exterior', 0, 10, 10.5, 0.5),
      mk('left',   'wall-exterior', 0, 0, 0.5, 10.5),
      mk('tag', 'annotation-room-tag', 5, 5, 0, 0, { roomName: 'Bedroom', roomNum: '101' }),
    ]
    const rooms = detectRooms(elements)
    expect(rooms).toHaveLength(1)
    const r = rooms[0]
    expect(r.name).toBe('Bedroom')
    expect(r.num).toBe('101')
    expect(r.bounds).toEqual({ left: 0.5, top: 0.5, right: 10, bottom: 10 })
    expect(r.widthFt).toBe(9.5)
    expect(r.heightFt).toBe(9.5)
    expect(r.area).toBe(90) // Math.round(9.5 * 9.5)
  })

  it('falls back to a 12x12 default box when no boundary walls are nearby', () => {
    const elements = [mk('tag', 'annotation-room-tag', 50, 50, 0, 0, { roomName: 'Void' })]
    const rooms = detectRooms(elements)
    expect(rooms[0].bounds).toEqual({ left: 44, top: 44, right: 56, bottom: 56 })
    expect(rooms[0].widthFt).toBe(12)
  })

  it('defaults name to "Room" and num to empty string when properties are missing', () => {
    const elements = [mk('tag', 'annotation-room-tag', 5, 5, 0, 0)]
    const rooms = detectRooms(elements)
    expect(rooms[0].name).toBe('Room')
    expect(rooms[0].num).toBe('')
  })

  it('assigns furniture inside a room to elementIds and excludes furniture outside it', () => {
    const elements = [
      mk('top',    'wall-exterior', 0, 0, 10.5, 0.5),
      mk('right',  'wall-exterior', 10, 0, 0.5, 10.5),
      mk('bottom', 'wall-exterior', 0, 10, 10.5, 0.5),
      mk('left',   'wall-exterior', 0, 0, 0.5, 10.5),
      mk('tag', 'annotation-room-tag', 5, 5, 0, 0, { roomName: 'Bedroom' }),
      mk('bed', 'furniture-bed', 3, 3, 1, 1),       // center inside room
      mk('far-chair', 'furniture-chair', 50, 50, 1, 1), // nowhere near the room
    ]
    const rooms = detectRooms(elements)
    expect(rooms[0].elementIds).toEqual(['bed'])
  })

  it('connects two rooms sharing a door and records each other by name', () => {
    const elements = [
      mk('top',    'wall-exterior', 0, 0, 21, 0.5),
      mk('bottom', 'wall-exterior', 0, 10, 21, 0.5),
      mk('left',   'wall-exterior', 0, 0, 0.5, 10.5),
      mk('right',  'wall-exterior', 20, 0, 0.5, 10.5),
      mk('door', 'door-single', 10, 4, 0.5, 2), // vertical doorway between the two rooms
      mk('tagA', 'annotation-room-tag', 5, 5, 0, 0, { roomName: 'Room A' }),
      mk('tagB', 'annotation-room-tag', 15, 5, 0, 0, { roomName: 'Room B' }),
    ]
    const rooms = detectRooms(elements)
    const a = rooms.find(r => r.name === 'Room A')!
    const b = rooms.find(r => r.name === 'Room B')!
    expect(a.connectedTo).toEqual(['Room B'])
    expect(b.connectedTo).toEqual(['Room A'])
  })

  it('does not connect rooms when there is no opening between them', () => {
    const elements = [
      mk('top',    'wall-exterior', 0, 0, 21, 0.5),
      mk('bottom', 'wall-exterior', 0, 10, 21, 0.5),
      mk('left',   'wall-exterior', 0, 0, 0.5, 10.5),
      mk('mid',    'wall-exterior', 10, 0, 0.5, 10.5), // solid wall, no door
      mk('right',  'wall-exterior', 20, 0, 0.5, 10.5),
      mk('tagA', 'annotation-room-tag', 5, 5, 0, 0, { roomName: 'Room A' }),
      mk('tagB', 'annotation-room-tag', 15, 5, 0, 0, { roomName: 'Room B' }),
    ]
    const rooms = detectRooms(elements)
    expect(rooms.every(r => r.connectedTo.length === 0)).toBe(true)
  })
})
