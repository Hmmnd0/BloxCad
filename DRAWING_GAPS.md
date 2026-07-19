# BloxCad Drawing Gaps

Identified gaps in blox library, rendering capabilities, and canvas tools relative to professional architectural drawing practice.

---

## Annotation / Cross-Reference

The biggest missing category. Without these, drawings can't reference each other and don't read as professional documents.

| Gap | Notes |
|-----|-------|
| Section cut marker | Circle-with-arrow showing where a section is cut and which sheet it references. Every professional set has dozens. |
| Detail bubble / reference tag | Circle with drawing number and sheet number for cross-referencing. |
| Column grid | A/B/C... 1/2/3... bubbles at plan edges. Any commercial or multi-bay building is unreadable without these. |
| Spot elevation marker | Filled triangle with elevation number. Used in floor plans, site plans, and sections. |
| Break line | Zigzag line indicating "drawing continues but not shown." Essential for long elevations and sections. |
| Slope / pitch indicator | Arrow with "1:12" or "4:12" notation. Needed for ramps, roofs, drainage slopes. |

---

## Site / Landscape

Completely absent. Site plans are currently impossible.

| Gap | Notes |
|-----|-------|
| Tree / shrub symbol | Standard plan-view circle with radial lines |
| Parking stall + drive aisle | Standard 9×18 ft stall with striping |
| Property line / setback | Dashed dot-dash line with label |
| Sidewalk / paving hatch | Surface material pattern for hardscape |
| Contour line | Topographic elevation line with label |

---

## Floor Plan Elements

| Gap | Notes |
|-----|-------|
| Elevator / lift | Completely missing from the library |
| Ramp | Required for accessibility compliance on nearly every project |
| Closet rod and shelf | Standard interior annotation |
| Accessible (wheelchair) symbol | Required on accessible drawings |
| Plumbing chase / shaft | Cross-hatched rectangle used for coordination |

---

## Detail / Section Elements

| Gap | Notes |
|-----|-------|
| Spread footing / grade beam | No below-grade structural elements exist |
| Concrete slab on grade | The most common floor assembly; missing from details |
| W-shape steel beam (section) | I-beam cross-section for structural detail views |
| Rebar in concrete | Dots / circles with X for rebar in section |
| Waterproof membrane / vapor barrier | Wavy line used in wall and foundation details |

---

## Canvas / Tool System

These are missing capabilities, not missing blox.

| Gap | Priority | Notes |
|-----|----------|-------|
| ~~Line weight control~~ ✅ Done | High | Pen-weight hierarchy implemented in `src/utils/lineWeights.ts`: cut (walls, columns) 2.25, heavy (elevation profiles) 1.5, object outlines 1.0, reference (dimensions) 0.6, detail linework 0.5. |
| **Freeform hatch tool** | High | A way to apply a hatch pattern to any area (not just specific blox). The polygon blox partially helps but can't apply different hatch types. |
| **Dimension in feet-inches** | High | Current dims show decimal feet. US construction drawings use 7'-6", not 7.5 ft. |
| Arc / curve drawing | Medium | No way to draw curved walls, curved stairs, or circular rooms. |
| Text size / weight options | Medium | `text-note` renders at one fixed font size. Titles, room labels, and callouts need different sizes. |
| Snap to element center | Medium | Snap only works to edges. Centering fixtures in rooms or on walls requires manual math. |

---

## Priority Order

1. ~~**Line weight control**~~ ✅ Done — pen-weight hierarchy in `src/utils/lineWeights.ts`
2. **Section cut marker + column grid** — unlocks an entire class of professional drawings
3. **Dimension feet-inches format** — affects every US project
4. **Elevator + ramp** — commonly needed, missing from floor plan library
5. **Site / landscape blox** — opens up a new drawing type entirely
6. **Freeform hatch tool** — improves material legibility across all drawing modes
7. **Detail / section structural elements** — completes the detail mode library
8. **Arc / curve tool** — enables curved geometry currently impossible to draw
