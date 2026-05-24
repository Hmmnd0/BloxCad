# bloxCAD

Architectural floor plan drawing tool built with Electron, React, and Konva.js.

## Features

- Place and resize architectural blox (walls, doors, windows, stairs, fixtures, furniture, casework)
- Snap-to-grid and edge-snap alignment guides
- Dimension lines (inside and outside)
- Stair landings and custom rectangle shapes
- Human scale figure for reference
- Layer management
- Export to PNG and PDF
- Undo / redo

## Keyboard Shortcuts

### Tools

| Key | Tool |
|-----|------|
| `V` | Select |
| `H` | Pan |
| `W` | Wall |
| `D` | Dimension |
| `S` | Rectangle |

### Edit

| Shortcut | Action |
|----------|--------|
| `⌘Z` | Undo |
| `⌘⇧Z` | Redo |
| `⌘C` | Copy |
| `⌘V` | Paste |
| `⌘D` | Duplicate |
| `⌘A` | Select all |
| `Delete` / `Backspace` | Delete selected |
| `R` | Rotate selected 90° |

### View

| Shortcut | Action |
|----------|--------|
| `⌘+` / `⌘=` | Zoom in |
| `⌘-` | Zoom out |
| `⌘0` | Reset view |
| `Scroll wheel` | Zoom |

### Canvas

| Key | Action |
|-----|--------|
| `↑ ↓ ← →` | Nudge selected (1 ft) |
| `⇧ + arrows` | Nudge selected (10 ft) |
| `Escape` | Cancel current action / deselect |

## MCP Server (Claude integration)

bloxCAD ships an MCP server that lets Claude design floor plans directly on the canvas — place walls, doors, fixtures, and dimensions through natural language.

### Setup

**1. Install the MCP server dependencies:**

```bash
cd mcp-server
npm install
```

**2. Add to Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "bloxcad": {
      "command": "node",
      "args": ["/absolute/path/to/BloxCad/mcp-server/index.mjs"]
    }
  }
}
```

Replace the path with the actual location of your bloxCAD folder.

**3. Open bloxCAD first, then start Claude Desktop.**

The app listens on `localhost:57489`. As long as bloxCAD is running, Claude can read and modify the current project.

### Available tools

| Tool | What it does |
|------|-------------|
| `list_blox` | List all element types with IDs and dimensions |
| `get_project` | Read current canvas state (elements, dims) |
| `place_element` | Place any blox at x,y coordinates (feet) |
| `place_wall` | Draw a wall segment between two points |
| `update_element` | Move, resize, or rotate an element |
| `delete_elements` | Remove elements by ID |
| `add_dimension` | Add a dimension line |
| `undo` / `redo` | Undo or redo the last action |

### Example prompts

- *"Draw a 20×15 ft rectangular room with exterior walls"*
- *"Add a bathroom in the top-right corner with a toilet, vanity, and door"*
- *"Place a queen bed centered in the bedroom with a nightstand on each side"*
- *"Dimension all the exterior walls"*

## Download

See [Releases](../../releases) for the latest macOS `.dmg`.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run package
# DMG and zip appear in release/
```

## Tech Stack

- [Electron](https://www.electronjs.org/) 32
- [React](https://react.dev/) 18 + TypeScript
- [Konva.js](https://konvajs.org/) / react-konva
- [Zustand](https://github.com/pmndrs/zustand)
- [electron-vite](https://evite.netlify.app/)
- [electron-builder](https://www.electron.build/)
