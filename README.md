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
