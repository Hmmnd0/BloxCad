/**
 * Pen-weight hierarchy for architectural drawings, in px at 1:1 stage scale.
 * Strokes scale with zoom (Konva default), so ratios between tiers are what
 * matter — they mirror hand-drafting pen sizes:
 *
 *   cut       — elements sliced by the plan/section plane: walls, columns
 *   heavy     — prominent visible outlines: building profile in elevation
 *   object    — visible object outlines: fixtures, furniture, casework
 *   reference — dimensions, leaders, grid bubbles, annotations
 *   detail    — linework inside an object: hatching, drawer pulls, mortar
 */
export const LINE_WEIGHTS = {
  cut: 2.25,
  heavy: 1.5,
  object: 1.0,
  reference: 0.6,
  detail: 0.5,
} as const

export type LineWeightClass = keyof typeof LINE_WEIGHTS
