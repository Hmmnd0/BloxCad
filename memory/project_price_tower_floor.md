---
name: project-price-tower-floor
description: Price Tower floor plan tracing — current state, OpenCV detection built, ready to continue interior walls
metadata:
  type: project
---

Frank Lloyd Wright's Price Tower (Bartlesville, OK) — 4-wing floor plan on a 30° triangular module. Tracing the HABS floor plan from `/Users/joe/Downloads/price_tower_floorplan.jpg`.

**Underlay calibration:** 552×555px, realWidthFt=88, scale=0.1594 ft/px

**What's placed (19 exterior walls):**
- Dwelling (upper-left): orthogonal box y=3–42, x=4–36; kitchen divider at x=27
- Gyno (upper-right): diagonal exterior walls ~80° from horizontal, x=37–60, y=1–43
- Surgeon (lower-left): diagonal walls mirroring Gyno, x=3–36, y=44–83
- Dentist (lower-right): diagonal walls, x=44–80, y=44–83

**OpenCV wall detection built — NOT YET RUN via MCP:**
- `tools/analyze_walls.py` — standalone Python script (opencv-python required)
- `detect_walls_opencv` MCP tool added to `mcp-server/index.mjs`
- `get_underlay_info` updated in `useMcpBridge.ts` to expose `imageUrl`
- Dominant angles detected from raw run: 90°, 150°, 60°, 0° — matches 30° triangular module perfectly

**Next steps (continue here):**
1. Restart BloxCad app so new MCP server changes take effect
2. Call `detect_walls_opencv` with the loaded underlay
3. Use detected wall segments to place interior partitions (examination rooms, kitchen, reception, etc.)
4. Add central hexagonal elevator core connecting the 4 wings
5. All walls must use diagonal x1,y1→x2,y2 coordinates — see [[feedback-angles]]

**Why:** Building walls are at 60°/90°/150° angles. Must NOT default to orthogonal.
**How to apply:** Call `detect_walls_opencv` first, read the angleBuckets output, then place_wall using the actual detected angles.
