---
name: project-opencv-integration
description: OpenCV wall detection pipeline built into BloxCad MCP — files changed, how to use
metadata:
  type: project
---

OpenCV-based wall detection is built and integrated as of 2026-06-06.

**Files changed:**
- `tools/analyze_walls.py` — Python script: Gaussian blur (suppress hatch) → Canny → HoughLinesP → dedup → JSON output
- `mcp-server/index.mjs` — added `detect_walls_opencv` tool definition + handler (spawns Python subprocess)
- `src/hooks/useMcpBridge.ts` — `get_underlay_info` now returns `imageUrl` so the MCP server can access the raw file

**How the tool works:**
1. Calls `get_underlay_info` to get `imageUrl` and `calibration.realWidthFt`
2. Resolves `file://` URL to local path (handles http too via temp file)
3. Spawns `python3 tools/analyze_walls.py` with calibration args
4. Returns `walls[]` (x1/y1/x2/y2 in canvas feet, angle_deg, length_ft) + `angleBuckets` histogram

**Tool params:** `minLengthFt` (default 4), `maxLengthFt` (default 40), `topN` (default 50)

**Requirements:** `python3` + `opencv-python` (`pip3 install opencv-python`) — confirmed available on this machine.

**Why:** Without pre-analysis, walls were being placed at wrong orthogonal angles. This closes the loop — run once at session start, read the angle buckets, then all place_wall calls use the correct detected angles.

**How to apply:** At the start of any floor plan tracing session with an angular building, call `detect_walls_opencv` before placing a single wall. The `angleBuckets` output tells you the building's dominant angles. See [[feedback-angles]].
