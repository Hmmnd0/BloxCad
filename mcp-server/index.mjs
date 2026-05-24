#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

const PORT = 57489
const BASE = `http://localhost:${PORT}`

async function callBloxCAD(action, payload = {}) {
  let res
  try {
    res = await fetch(`${BASE}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
      signal: AbortSignal.timeout(8000),
    })
  } catch (e) {
    const msg = e.code === 'ECONNREFUSED' || e.name === 'TimeoutError'
      ? 'bloxCAD is not running — open the app first.'
      : e.message
    throw new Error(msg)
  }
  const body = await res.json()
  if (body.error) throw new Error(body.error)
  return body
}

const TOOLS = [
  {
    name: 'list_blox',
    description:
      'List every architectural element available in the bloxCAD library. ' +
      'Returns id, name, category, description, and default width/height in feet. ' +
      'Always call this before place_element so you know valid bloxId values.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_project',
    description:
      'Return the current project state: all placed elements (id, bloxId, x, y, width, height in feet, rotation) ' +
      'and dimension lines. Returns null if no project is open in bloxCAD.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'place_element',
    description:
      'Place an architectural element on the canvas. x/y is the top-left corner in feet. ' +
      'width/height are optional — omit to use the blox default size. ' +
      'Returns the new element id.',
    inputSchema: {
      type: 'object',
      properties: {
        bloxId:  { type: 'string', description: 'Element type ID from list_blox, e.g. "fixture-toilet", "door-single"' },
        x:       { type: 'number', description: 'Left edge in feet from canvas origin' },
        y:       { type: 'number', description: 'Top edge in feet from canvas origin' },
        width:   { type: 'number', description: 'Width in feet (optional)' },
        height:  { type: 'number', description: 'Height in feet (optional)' },
      },
      required: ['bloxId', 'x', 'y']
    }
  },
  {
    name: 'place_wall',
    description:
      'Draw a wall segment from (x1,y1) to (x2,y2). Automatically determines horizontal vs vertical ' +
      'orientation and applies the correct thickness for the wall type. Returns the new element id.',
    inputSchema: {
      type: 'object',
      properties: {
        x1:       { type: 'number', description: 'Start X in feet' },
        y1:       { type: 'number', description: 'Start Y in feet' },
        x2:       { type: 'number', description: 'End X in feet' },
        y2:       { type: 'number', description: 'End Y in feet' },
        wallType: {
          type: 'string',
          enum: ['wall-exterior', 'wall-interior', 'wall-cmu'],
          description: 'Wall type (default: wall-exterior)'
        }
      },
      required: ['x1', 'y1', 'x2', 'y2']
    }
  },
  {
    name: 'update_element',
    description:
      'Move, resize, or rotate an existing element. All update fields are optional — only provided fields change.',
    inputSchema: {
      type: 'object',
      properties: {
        id:       { type: 'string', description: 'Element ID from get_project' },
        x:        { type: 'number', description: 'New left edge in feet' },
        y:        { type: 'number', description: 'New top edge in feet' },
        width:    { type: 'number', description: 'New width in feet' },
        height:   { type: 'number', description: 'New height in feet' },
        rotation: { type: 'number', description: 'Rotation degrees: 0, 90, 180, or 270' },
      },
      required: ['id']
    }
  },
  {
    name: 'delete_elements',
    description: 'Delete one or more placed elements by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Element IDs to delete' }
      },
      required: ['ids']
    }
  },
  {
    name: 'add_dimension',
    description:
      'Add a dimension line between two measured points. ' +
      'offset controls how far the line sits from the reference edge in feet ' +
      '(negative = above/left of the line, default -1.5).',
    inputSchema: {
      type: 'object',
      properties: {
        x1:     { type: 'number' }, y1: { type: 'number' },
        x2:     { type: 'number' }, y2: { type: 'number' },
        offset: { type: 'number', description: 'Feet offset from reference edge (default -1.5)' }
      },
      required: ['x1', 'y1', 'x2', 'y2']
    }
  },
  {
    name: 'undo',
    description: 'Undo the last action in bloxCAD.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'redo',
    description: 'Redo the last undone action in bloxCAD.',
    inputSchema: { type: 'object', properties: {} }
  },
]

const server = new Server(
  { name: 'bloxcad', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params
  try {
    const result = await callBloxCAD(name, args ?? {})
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
