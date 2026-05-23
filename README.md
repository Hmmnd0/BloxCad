# BloxCad

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
