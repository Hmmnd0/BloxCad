# Continue bloxCAD library upgrades

## Permit-reference implementation — September 8, 2026

- User supplied `/Users/joe/Documents/4727 S Wabash - For Permit - 8-24-26.pdf` as a symbol/layout reference. Image-only PDF; visually inspected A0.0 (code and zoning matrices, demolition) and A1.0 (door, hardware, wall and equipment schedules), plus elevations. Do not copy its project values, certification or architect seal.
- Added five Demolition library definitions: removal wall, door, window, area; existing wall to remain. Independent annotation blox, not destructive editing/phase conversion of live walls. Shared demolitionGeometry feeds canvas/library/inspector and native SVG/print symbols. Wall union exclusion tested.
- Panels > Permit Sheet & Schedules opens editable persisted project.permitData. Separate Chicago/Indianapolis matrices, scope, door/hardware/wall/equipment schedules, drawing index, demolition notes, abbreviations. Manual project requirements; official reference-directory links checked. No automatic code findings or copied Wabash requirements.
- Door refresh adds rows by stable element ID, keeps edited rows, flags removed doors; no invented door height from plan depth. Marks entered in schedule are not yet linked back to plan tags. Hardware rows are manually coordinated.
- HTML companion sheet download and sandboxed iframe preview have side-by-side code/zoning matrices and tabular schedules. This does NOT yet compose a full A0 cover with site/demolition viewports or integrate schedules into multi-sheet PDF export. Existing canvas symbol key remains in place. Further work: door tag coordination, full sheet composition, PDF pagination/export, more reference-specific demolition symbols.
- Tests: 284 / 27 files passed; typecheck/build passed before last inspector-only addition (rerun performed). Browser check-permit-sheet.mjs verifies 5 cards, door refresh without duplication, jurisdiction selection and save/reload. Visually inspected permit-sheet-preview.png and demolition-library.png; schedules screenshot added for inspection. Browser test waits for autosave before reload. No user drawing mutated.

## Review checkpoint — September 8, 2026 (takes precedence)

- User rejected the Details rewrite. Original Details renderer map remains intact; no REFINED_DETAILS wiring/files remain. Preserve material-specific section/face/edge geometry when considering future improvements.
- Found and repaired an incomplete rollback: it deleted the entire inspector-preview JSX, including previews for previously upgraded categories. Restored the pre-Details preview chain.
- Found routing regressions: incorrect quadratic sampling nearly flattened control wires, portrait conduit ran horizontally, arrowhead lost its fill, and the replacement canvas renderer dropped the existing rotation-aware labels. Restored the established three MEP routing canvas renderers. Corrected shared routingGeometry's quadratic, portrait conduit and arrow fill for thumbnails/pure SVG. RefinedRouting.tsx is now unused; do not re-enable it without testing label rotations/mirroring/clipping.
- Added RoutingPreview.tsx: centered complete geometry with A3 example on home-run thumbnail. Actual circuit metadata unchanged.
- Verified typecheck, 280 tests / 26 files, build; existing Vite import warnings only. Browser library audit passed all seven categories and inspector SVG. Audit counts 126 shared non-routing definitions of 213; 3 routing definitions now retain established canvas rendering. Previous 128 total was inaccurate. Details 34, Annotations 24, Elevation 26 remain outside shared geometry.
- Browser preview-dimensions and check-circulation passed: foundation movement/undo/linked references, 17 circulation previews, stair step count and MCP UP-left vector. Visually inspected library-electrical.png and routing-reviewed.png. This is a targeted regression review, not certification of every symbol/export.
- Fixed preview-walls.mjs stale hardcoded counts (Site now 16, Structural 9), added --routing. Broader site/export visual follow-ups still pending.
- No user project opened or mutated; disposable browser projects only. No commits or resets.

Suggested prompt for Luna (paste into this same task after switching models):

> Continue the bloxCAD upgrades in `/Users/joe/Claude Projects/BloxCad`. Read the CURRENT checkpoint below and inspect actual files before changing anything. 115 of 213 definitions are refreshed; don't redo those. Next inspect the ten remaining Site symbols, especially parameterized boundaries/utilities, then the three electrical routing symbols. Preserve continuous wall/foundation unions, hosted opening cuts, snapping, dimensions, routing properties and saved footprints. Share graphics between canvas, library, inspector, symbol key and exports. Keep identifiers readable when small or mirrored. Do not invent engineering values or claim code approval. Work in verified batches and keep this handoff current. The user asked to continue upgrading as far as possible.

## CURRENT checkpoint — September 7, 2026 (supersedes historical notes below)

- This continuation upgraded 73 definitions: 8 structural, 14 electrical devices, 12 mechanical, 10 plumbing, 5 life-safety, 5 low-voltage, 16 site and 3 electrical routing symbols. Prior refreshed total was 55, now **128 / 213**.
- Audit after the routing pass is expected to leave **84** = Details 34, Annotations 24, Elevation 26. Generic Rectangle is now included in the shared structural batch; re-run the audit to confirm.
- Shared sources added: structuralGeometry.ts, electricalGeometry.ts, equipmentGeometry.ts (32 MEP/life-safety/LV IDs), siteGeometry.ts (6 IDs), symbolBounds.ts. Tests match those names.
- RefinedFixture is now a reusable shape adapter, including filled closed polylines and counter-mirrored text. Existing fixture shapes still use it. Structural/electrical/equipment all use this adapter. RefinedSite supplies explicit pixelsPerFoot to shared site geometry; legacy live-store scale is fallback only. RendererProps now has optional pixelsPerFoot. Canvas, placement preview, sheet and legend pass the correct scale.
- Site spacing preserved: parking 9ft, sidewalk joints 5ft, driveway joints 8ft, deck lines .5ft. These existing defaults are symbolic, not an engineered layout. Tree/shrub footprints preserved; shrub vector samples original ten-lobed outline.
- Equipment labels have >=12px (9pt at 96 DPI) fonts and conservative width, moving outside an enclosure if they don't fit. Fixed actual clipped SD/WH/WS labels, mirrored device labels, and EXIT's old height*16 font-size bug. Device callout bounds participate in fit/legend placement, **not snapping**.
- SVG uses shared native geometry for all these new symbols, with consistent text mirroring. Wall artwork still embedded over native unions; no change to wall topology or cuts.
- Electrical routing now uses routingGeometry.ts and RefinedRouting.tsx for conduit, circuit wire and homerun. Conduit keeps its optional conduitLabel, circuit wire stays a curved dashed control path, and homerun retains its break, terminal arrow and circuitLabel. The routing tool behavior and metadata contracts were preserved.
- Generic Rectangle now uses the shared structural adapter with a neutral outline and cross, keeping it recognizable as an intentionally unspecified coordination footprint. Its freeform purpose and saved dimensions remain unchanged.
- Final code verification after routing: **273 tests / 25 files**, typecheck and production build passed. Vite mixed-import warnings are pre-existing.
- Browser checks passed on fresh port 5196 before the final site pass: all seven tested library categories had SVG cards; inspector SVG present; structural, electrical, equipment and earlier site contact sheets passed. Equipment/electrical checks compare Konva textArr with full label and reject reflected text transforms. The final parameter-aware site visual/audit/export checks were attempted on fresh port 5197 but blocked by the account credit limit before execution.
- Regression scripts preview-dimensions.mjs and check-circulation.mjs passed before the final parameter-aware site geometry change: foundation dimensions follow moves/undo; stair flips/rotation and MCP UP-left vector are preserved. Export --services and earlier --site export passed with zoom-independent PNG and correct 17x11 PDF MediaBox. The final site export should be rerun after credits reset. The mixed-symbol scene is intentionally a QA sample, not a proposed floor plan.
- Visually inspected structural, electrical, equipment and site contact sheets, library-electrical screenshot, and service SVG export. Latest PDF was not separately re-rendered visually this continuation.
- No Electron app restart, live-project mutation, model switch, automation or git commit was performed. All headless browser checks use disposable profiles and required approved sandbox escalation.

### Continue efficiently

1. Run check-library-upgrades.mjs to confirm the post-site exact remaining counts. Don't report every remaining item as a missing preview: many have legacy artwork, just not the new shared implementation.
2. The 10 remaining property/setback/easement/contour/fence/retaining-wall/service symbols were just moved into shared siteGeometry.ts, including properties-bearing, lineType, setbackFt, easementType and elevLabel. Re-run the blocked visual and export checks first; inspect labels before changing them.
3. Electrical conduit, circuit wire and homerun remain deliberately unchanged. Preserve paths, arrows, circuit tags, rotation and MCP semantics. Never replace them with static gallery icons.
4. Wall-fire text under mirroring/rotations remains a separate follow-up; device text was fixed, not wall text. Very short wall rating labels/junction cuts still deserve QA. Wall print artwork currently ignores outer flips, so fix canvas/export together if addressing that.
5. Larger architectural review/code-compliance work is not part of cosmetic symbol approval. Existing stair review remains explicit and unverified where inputs are missing.
6. Before stopping, run typecheck/tests/build and actual visual checks, then update this CURRENT checkpoint. Do not reset the dirty worktree.

### Verification commands / previews

Start fresh: `npm exec vite -- --host 127.0.0.1 --port 5197 --strictPort` (5196 was the last active server).
Use `BLOX_PREVIEW_URL=http://127.0.0.1:5197` with scripts:

- `node scripts/check-library-upgrades.mjs`
- `node scripts/preview-walls.mjs --structural` (8)
- `node scripts/preview-walls.mjs --electrical` (14)
- `node scripts/preview-walls.mjs --equipment` (32; includes plumbing, life-safety and low-voltage)
- `node scripts/preview-walls.mjs --site` (6)
- `node scripts/preview-print-sheet.mjs --services` or `--site`
- `node scripts/preview-dimensions.mjs`
- `node scripts/check-circulation.mjs`

Outputs: artifacts/structural-refined.png, electrical-refined.png, equipment-refined.png, site-refined.png, library-electrical.png, library-life-safety.png, plan-sheet-svg.png. Export scripts overwrite the disposable plan-sheet sample, not user drawings.

## Historical notes (CURRENT checkpoint above takes precedence)

## Safety / workflow

- Large dirty worktree contains the user's prior work. Do not reset, discard or commit it without being asked.
- Use apply_patch. No new dependencies or unrelated redesign needed.
- Do not create a separate task unless explicitly requested. Switching models is the user's choice; this file does not schedule an automatic switch.
- Run `npm run typecheck`, `npm test`, `npm run build`. Use disposable headless browser scripts; never load the user's Electron autosave profile.
- App may need restarting to load Electron-main PDF changes. Do not relaunch it with unsaved work without checking.

## Baseline before this wall pass

- 213 definitions; 48 fully refreshed (13 furniture, 12 fixtures, 6 casework, 17 openings/stairs). Seven wall upgrades are now being implemented; inspect below for final status.
- Shared wall/foundation union: `src/utils/wallUnion.ts`, `WallOutlineLayer.tsx`; hosted cuts: `hostedOpenings.ts`. Foundation renderers are suppressed in ElementsLayer: union fill/outline renders the actual foundation.
- Physical stair review: `stairReview.ts`, `StairDesignFields.tsx`. Explicit 2021 IRC baseline, missing information remains unverified. No automatic code approval or speculative stair fixes.
- Export redesign immediately preceded this pass: `planSheet.ts`, `printSheet.tsx`, `PlanNotesLayer.tsx`, `pngResolution.ts`. PNG/PDF/SVG use a dedicated sheet scene, independent of viewport zoom/selection. PDF preserves 288-DPI raster's physical size; PNG gets pHYs metadata; SVG keeps shared native vectors with embedded high-resolution canvas-only artwork. Legend is a drawing-space symbol key, not inventory; scale bar moves with the drawing. Title block and dimension text enlarged.
- Last observed complete export test run before final tweaks: 149 tests. A further PNG-resolution test was added (expect 150); recheck rather than assuming it passed. Export samples: `artifacts/plan-sheet.png`, `artifacts/plan-sheet-svg.png`, `output/pdf/plan-sheet.pdf`. Scripts `preview-print-sheet.mjs`, `check-stair-design.mjs`, `check-circulation.mjs`, `preview-wall-unions.mjs`, `preview-dimensions.mjs`.
- `buildProjectSVG` remains a legacy pure helper for tests; user-facing exportAsSVG now calls printSheet. Do not regress production export to labeled fallback rectangles.

## September 9 symbol refinement checkpoint

- Latest Details pass: enlarged actual-renderer library/inspector previews to 96×56; short normalized material specimens expose textures without altering placed element dimensions. Preview pen widths capped for clean outlines. Wood variants intentionally retain shared conventions.
- Batt pattern now uses connected Bezier loops; brick and CMU have distinct readable coursing and mortar joints. Library audit: 218 previews, zero blanks/errors; drawing audit: 218 renderers, no clipped labels/errors; 315 tests passed, typecheck/build passed before final preview sizing, then typecheck/build rerun for that sizing. Visually inspected detail-library-previews.png after final sizing.
- This is not a completed audit of every export scale or all annotation/elevation/site variants. Floorplan and Price Tower work remain paused.

- Floorplan tracing is paused at the user's request; do not modify the live drawing while finishing symbols.
- Latest changes: larger elevation datum labels/pointers, lighter grade hatch and stronger surface line; lighter staggered shingle courses; drawing-title reference appears once with scale aligned beneath the title; outlined revision triangles with length-aware label sizing.
- Verified typecheck, 315 tests, production build, and audit-all-blox (218 renderers, no clipped default labels or browser errors). Inspected updated Annotations-2 and Details-3 sheets visually. This does not certify every variant or export scale.
- Remaining review: small site labels in long-footprint previews, thin construction-layer previews, and variant/export readability. Do not report all 100 symbols as finished from default-render audit alone.
- Isolated preview Vite server: 5231. Actual renderer sheets: artifacts/blox-audit.

## Visual QA runtime

Playwright import: `/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs`.
Chromium: `/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`.
Start a fresh Vite port after store-linked edits to avoid stale HMR store instances:
`npm exec vite -- --host 127.0.0.1 --port 5189 --strictPort`
Then `BLOX_PREVIEW_URL=http://127.0.0.1:5189 node scripts/preview-print-sheet.mjs`.
Inspect generated images, not just exit codes. Standard Vite dynamic/static import warnings are pre-existing.

## Latest checkpoint — September 8, annotation audit and permit linking

This checkpoint supersedes older counts and next-step lists below.

Latest site/preview continuation: all 16 Site renderer map entries now use refinedSite/siteGeometry (ten previously still used old canvas components while previews/SVG used shared geometry). Preserved explicit fontSize, bearings, roles, setbacks and scale-derived lengths; added readable text bounds, clipped easement/retaining-wall hatch segments, contour label gap, nonreversing short setbacks and terminal fence posts. Tests added for survey values/font settings/hatch bounds/gaps. CanvasBloxPreview now uses a node-predicate Shape search and a preview-only 0.65px minimum stroke: the new actual-card raster audit caught drywall being effectively blank before this fix. Drawing title preview uses fixed sample metadata. scripts/check-library-previews.mjs checks all 218 actual BloxItem previews for nonblank ink, emits library-manifest.json and full/detail screenshot sheets. Passed 218/218, zero blank previews or browser errors; inspected detail-library-previews.png and Site-1.png. Typecheck/build and 298 tests pass. 218-renderer audit also passes. Full symbol revision/property-variant and permit PDF validation remain unfinished; default-thumbnail success alone is not completion.

Follow-up: user explicitly requests revision of ALL symbols, not only failed renderers. Full revision is still in progress; do not equate audit success with completed redesign. Inspector now uses CanvasBloxPreview for Details/Annotations/Elevation. Gutter strap is a native Line and body has declared bounds, fixing fit/export bounds. Plumbing VTR/HB/FD and low-voltage CAM/KP now have identifiers in shared canvas/preview/SVG geometry, with five new tests. Section/detail callout secNum/detailNum now populate schedule marks, with a regression test. Latest checks: 294 tests pass, typecheck/build pass, 218-renderer audit with no clipping/errors, permit browser save/refresh/jurisdiction/reload check passes. Audit now fails on clipped default text, giant grid extents or missing gutter strap bounds. Visually reviewed Furniture-1, Fixtures, Mechanical, Plumbing, LowVoltage, Fire/Safety, Electrical-1, Demolition, Openings, Stairs, Casework, Site-1/2; rechecked updated Plumbing/LowVoltage/Details-1. Site contact-sheet labels remain visually tiny and warrant investigation at actual paper scale. Full property-variant/thumbnail UI/PDF verification remains pending. No claim of all 218 redesigned or standards certification.

- There are 218 definitions, including five demolition overlays. Preserve restored original Details geometry and the rotation-aware original routing renderers; do not replace them with generic boxes.
- PermitSheetDialog populates through permitSync.ts on open and refresh/export. Explicit targetId links supply door-tag and leader text; no proximity guessing. Rooms, callouts, marked walls, equipment and demolition are synced. Source snapshots/overrides preserve manual edits including blanks; removed sources are flagged. AnnotationTargetField links existing leaders/door tags in the inspector; future autoCallout labels carry targetId.
- Details/Annotations/Elevation library cards now use CanvasBloxPreview with actual drawing renderers. Inspector parity and complete thumbnail-level verification remain pending.
- Repaired annotation grid bubble's heightPx+99999 line, restored scalloped revision-cloud geometry, fit room-name text, expanded fire-rating annotation bounds to retain the whole readable label, and clipped shingle courses to their material footprint. Original physical material dimensions are unchanged.
- scripts/audit-all-blox.mjs rendered all 218 definitions: finite bounds, no clipped default labels, no browser errors. Latest contact sheets are artifacts/blox-audit/*.png; Annotations-1.png was visually inspected after these fixes. This is NOT proof every symbol/property variant has been visually reviewed.
- npm run typecheck, npm test (288 tests / 28 files), npm run build all passed. Existing Vite mixed static/dynamic import warnings remain.
- Permit PDF + drawing export code exists in permitSet.ts and the Electron bridge, but PDF pagination/physical-scale/visual verification remains pending. Do not claim the export is fully verified or restart the user's app without considering open project state.
- Next: inspect remaining category contact sheets and property variants; address gutter strap out-of-bounds preview; verify all library thumbnails and inspector parity; render and inspect the new permit PDF. Use the PDF skill and its operation marker before generating a PDF. Fresh Vite currently port 5217; headless browser scripts require approved escalation.

## Current wall-pass checkpoint

Verified checkpoint, September 7, 2026:

- Seven wall types now use `wallGeometry.ts`, `RefinedWall.tsx`, and `WallPreview.tsx`. The renderer map, library cards and inspector identities are wired to shared graphics. CMU uses plan-view hollow cells, exterior has restrained hatching, glazing has parallel frame lines, and fire ratings differ by labels and one/two dashed lines, not just color. Interior remains deliberately solid.
- Footing preview now matches the existing continuous union's all-sided 30% stem inset. The actual foundation is still rendered by wallUnion, not by independent per-run renderers. Union topology, hosted cuts, saved dimensions and footprints were not changed.
- Corrected glazing definition note: 0.375 ft is the plan envelope, not glass-pane thickness. These material graphics remain symbolic, not specified assemblies.
- `npm run typecheck`, `npm test` (161 tests, 19 files), and `npm run build` all passed after wall changes. Existing Vite mixed-import warnings remain.
- `scripts/preview-walls.mjs` passed: all seven actual canvas renderers in both orientations. Visually inspected `artifacts/walls-refined.png`.
- `preview-dimensions.mjs` passed: continuous foundation dimensions, linked inner stem corners, movement, undo and export assertions. No browser errors.
- `preview-print-sheet.mjs` passed: 17 × 11 inch physical sheet, identical PNG after changing viewport zoom/selection, correct PDF MediaBox, no browser errors. Visually inspected latest SVG screenshot: wall hatches, opening cuts, key and readable title block are present. Latest PDF itself was not re-rendered for visual inspection in this wall pass.
- Headless Chromium needed sandbox escalation; approved disposable profiles only. No user Electron project was opened/restarted. Built output is ready, but do not assume the currently running desktop app loaded it.

## Next bounded work for Luna

### Newer checkpoint — structural/electrical continuation in progress

- Eight structural definitions are now upgraded using structuralGeometry.ts and the reusable RefinedFixture adapter. Canvas/library/inspector/native SVG are connected. Poured foundation wall still uses the existing union and matching gray fill; no topology changes.
- Fourteen electrical device definitions now use electricalGeometry.ts and ElectricalPreview.tsx. Conduit, circuit wire and homerun are deliberately untouched. Qualifiers have a 12px minimum paper-space font with expanded text bounds; PNL/DISC move outside enclosures when they cannot fit. No voltage or circuit data was changed.
- 211 tests, typecheck and build passed after initial electrical integration. Visual sheets passed for eight structural and fourteen electrical symbols. Visual inspection caught a too-tight SD label; expanded text width from .68 to .8 em per character. That last fix needs recheck.
- New tests structuralGeometry.test.ts and electricalGeometry.test.ts include native SVG coverage. Structural preview sample sizing was corrected to preserve aspect ratios.
- Current Vite server is port 5191. preview-walls.mjs accepts --structural or --electrical. Latest images artifacts/structural-refined.png and artifacts/electrical-refined.png.
- Count after these two batches: 77 refreshed / 213 total, 136 remaining. Mechanical/plumbing is next, unless a newer checkpoint below supersedes this one.

1. Treat this as 55 refreshed definitions including this seven-wall presentation pass; 158 remain against the 213 baseline. Recount from source before reporting if definitions change. Do not redo the completed wall pass.
2. Wall edge cases worth testing next: mirrored fire-wall text (parent flips can mirror labels), very short segments, and junction/opening cuts through rating labels. Do not claim these were visually verified. Preserve union geometry while addressing label readability.
3. `wallGeometrySVG` exists, but production SVG currently embeds high-resolution wall artwork over native union paths. Optionally integrate native shared wall vectors with the exact hosted-cut clip and transformations; never drop wall artwork or substitute rectangles.
4. Next logical library batch is structural/foundation symbols, then electrical/lighting. Inspect actual renderer maps and definitions first; reuse shared geometry across canvas/library/key/export and add tests plus a visual sheet per bounded batch. Preserve established engineering meanings and don't invent ratings or compliant layouts.
5. Update this checkpoint with exact checks, remaining limitations, and next batch before stopping. User wants efficient progress, not automatic task creation or an unrequested model switch.
