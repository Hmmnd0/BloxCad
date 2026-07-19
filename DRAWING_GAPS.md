# BloxCad Drawing Gaps

Identified gaps in blox library, rendering capabilities, and canvas tools relative to professional architectural drawing practice.

---

## Annotation / Cross-Reference

The biggest missing category. Without these, drawings can't reference each other and don't read as professional documents.

| Gap | Notes |
|-----|-------|
| ~~Section cut marker~~ ✅ | `annotation-section-cut` + `annotation-section-ref` exist |
| ~~Detail bubble / reference tag~~ ✅ | `annotation-detail-bubble` exists |
| ~~Column grid~~ ✅ (partial) | `annotation-column-grid-h` exists. Missing: vertical variant with upright bubble text (rotating the H variant turns the label sideways). |
| ~~Spot elevation marker~~ ✅ | `annotation-elevation-marker` + `annotation-elevation-target` exist |
| ~~Break line~~ ✅ | `annotation-break-line` exists |
| Slope / pitch indicator | Arrow with "1:12" or "4:12" notation. Needed for ramps, roofs, drainage slopes. Still missing. |

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
| ~~Elevator / lift~~ ✅ | `fixture-elevator` exists |
| ~~Ramp~~ ✅ | `fixture-ramp` exists |
| Closet rod and shelf | Standard interior annotation. Still missing. |
| Accessible (wheelchair) symbol | Required on accessible drawings. Still missing. |
| Plumbing chase / shaft | Cross-hatched rectangle used for coordination. Still missing. |

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
| ~~Dimension in feet-inches~~ ✅ | High | Dims format as 7'-6" (`formatFeet` in scale.ts) |
| ~~Arc / curve drawing~~ ✅ | Medium | Arc wall tool + `place_arc_wall` MCP tool exist |
| Text size / weight options | Medium | `text-note` renders at one fixed font size. Titles, room labels, and callouts need different sizes. |
| Snap to element center | Medium | Snap only works to edges. Centering fixtures in rooms or on walls requires manual math. |

---

## Priority Order

1. ~~**Line weight control**~~ ✅ Done — pen-weight hierarchy in `src/utils/lineWeights.ts`
2. ~~**Section cut marker + column grid**~~ ✅ Done (vertical grid variant still open)
3. ~~**Dimension feet-inches format**~~ ✅ Done
4. ~~**Elevator + ramp**~~ ✅ Done
5. **Site / landscape blox** — opens up a new drawing type entirely (tree, parking, property line, paving, contour)
6. **Freeform hatch tool** — improves material legibility across all drawing modes
7. **Detail / section structural elements** — below-grade/concrete/steel: footing, slab on grade, W-shape, rebar, membrane (Details category is all wood-frame today)
8. ~~**Arc / curve tool**~~ ✅ Done
9. **Small-gaps sweep** — slope arrow, accessible symbol, closet rod, plumbing chase, vertical column grid
