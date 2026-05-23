import { BloxDefinition } from '../types'

export const BLOX_DEFINITIONS: BloxDefinition[] = [
  // ── WALLS ────────────────────────────────────────────────────────────────
  {
    id: 'wall-exterior',
    name: 'Exterior Wall',
    category: 'Walls',
    description: '6" thick exterior framed wall',
    defaultWidth: 10,
    defaultHeight: 0.5,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 1,
    widthPresets: [4, 6, 8, 10, 12, 16, 20]
  },
  {
    id: 'wall-interior',
    name: 'Interior Wall',
    category: 'Walls',
    description: '4.5" thick interior framed wall',
    defaultWidth: 8,
    defaultHeight: 0.375,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 1,
    widthPresets: [4, 6, 8, 10, 12, 16, 20]
  },
  {
    id: 'wall-cmu',
    name: 'CMU Wall',
    category: 'Walls',
    description: '8" concrete masonry unit wall',
    defaultWidth: 8,
    defaultHeight: 0.667,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 1,
    widthPresets: [4, 6, 8, 10, 12, 16, 20]
  },

  {
    id: 'insulation-batt',
    name: 'Insulation Batt',
    category: 'Walls',
    description: 'Fire-separation batt insulation hatch',
    defaultWidth: 8,
    defaultHeight: 0.5,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 1,
    minHeight: 0.25,
    widthPresets: [4, 6, 8, 10, 12, 16, 20]
  },

  // ── OPENINGS ─────────────────────────────────────────────────────────────
  {
    id: 'cased-opening',
    name: 'Cased Opening',
    category: 'Openings',
    description: 'Wall opening with jamb stops — no door',
    defaultWidth: 3,
    defaultHeight: 0.5,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 1,
    widthPresets: [2.5, 2.667, 3, 4, 5, 6, 8, 10, 12]
  },
  {
    id: 'door-single',
    name: 'Single Door',
    category: 'Openings',
    description: '3\'0" single swing door',
    defaultWidth: 3,
    defaultHeight: 3,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 2,
    widthPresets: [2, 2.333, 2.5, 2.667, 2.833, 3, 3.5]
  },
  {
    id: 'door-double',
    name: 'Double Door',
    category: 'Openings',
    description: '6\'0" double swing door',
    defaultWidth: 6,
    defaultHeight: 3,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 4,
    widthPresets: [4, 5, 6, 7, 8]
  },
  {
    id: 'door-sliding',
    name: 'Sliding Door',
    category: 'Openings',
    description: '6\'0" sliding glass door',
    defaultWidth: 6,
    defaultHeight: 0.5,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 4,
    widthPresets: [4, 5, 6, 8]
  },
  {
    id: 'window-single',
    name: 'Window',
    category: 'Openings',
    description: '3\'0" single window',
    defaultWidth: 3,
    defaultHeight: 0.375,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 1.5,
    widthPresets: [1.5, 2, 2.5, 3, 3.5, 4]
  },
  {
    id: 'window-double',
    name: 'Double Window',
    category: 'Openings',
    description: '5\'0" double window unit',
    defaultWidth: 5,
    defaultHeight: 0.375,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 3,
    widthPresets: [3, 4, 5, 6]
  },
  {
    id: 'window-multi',
    name: 'Multi-Pane Window',
    category: 'Openings',
    description: 'Window with adjustable pane count',
    defaultWidth: 6,
    defaultHeight: 0.375,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 2,
    widthPresets: [3, 4, 6, 8, 10, 12]
  },

  // ── STAIRS ───────────────────────────────────────────────────────────────
  {
    id: 'stairs-straight',
    name: 'Straight Stairs',
    category: 'Stairs',
    description: '3\'0" wide straight stair run',
    defaultWidth: 3,
    defaultHeight: 10,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 2.5,
    minHeight: 6
  },
  {
    id: 'stairs-landing',
    name: 'Stair Landing',
    category: 'Stairs',
    description: 'Flat landing platform between stair runs',
    defaultWidth: 3,
    defaultHeight: 3,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 1,
    minHeight: 1
  },
  {
    id: 'stairs-elevation',
    name: 'Stair Elevation',
    category: 'Stairs',
    description: 'Side-view stair profile for elevation drawings',
    defaultWidth: 10,
    defaultHeight: 7,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 3,
    minHeight: 3
  },
  {
    id: 'handrail',
    name: 'Handrail',
    category: 'Stairs',
    description: 'Stair or landing handrail — IRC required on stairways',
    defaultWidth: 3,
    defaultHeight: 0.25,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 1,
    widthPresets: [3, 3.5, 4, 5, 6, 8, 10, 12]
  },

  // ── FIXTURES ─────────────────────────────────────────────────────────────
  {
    id: 'fixture-toilet',
    name: 'Toilet',
    category: 'Fixtures',
    description: 'Standard water closet',
    defaultWidth: 1.5,
    defaultHeight: 2.5,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'fixture-sink-lav',
    name: 'Lavatory Sink',
    category: 'Fixtures',
    description: '18"×18" lavatory sink',
    defaultWidth: 1.5,
    defaultHeight: 1.5,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'fixture-bathtub',
    name: 'Bathtub',
    category: 'Fixtures',
    description: '30"×60" standard bathtub',
    defaultWidth: 2.5,
    defaultHeight: 5,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'fixture-sink-kitchen',
    name: 'Kitchen Sink',
    category: 'Fixtures',
    description: '33"×22" double basin kitchen sink',
    defaultWidth: 2.75,
    defaultHeight: 1.833,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'fixture-refrigerator',
    name: 'Refrigerator',
    category: 'Fixtures',
    description: '30"×30" refrigerator',
    defaultWidth: 2.5,
    defaultHeight: 2.5,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'fixture-range',
    name: 'Range / Stove',
    category: 'Fixtures',
    description: '30" range with 4 burners',
    defaultWidth: 2.5,
    defaultHeight: 2,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'fixture-dishwasher',
    name: 'Dishwasher',
    category: 'Fixtures',
    description: '24" dishwasher',
    defaultWidth: 2,
    defaultHeight: 2,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'fixture-vanity',
    name: 'Bathroom Vanity',
    category: 'Fixtures',
    description: '36"×21" wall-hung vanity with sink',
    defaultWidth: 3,
    defaultHeight: 1.75,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 1.5,
    widthPresets: [1.5, 2, 2.5, 3, 3.5, 4, 5, 6]
  },

  // ── FURNITURE ────────────────────────────────────────────────────────────
  {
    id: 'furniture-bed-twin',
    name: 'Twin Bed',
    category: 'Furniture',
    description: '38"×75" twin mattress',
    defaultWidth: 3.167,
    defaultHeight: 6.25,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'furniture-bed-full',
    name: 'Full Bed',
    category: 'Furniture',
    description: '54"×75" full/double mattress',
    defaultWidth: 4.5,
    defaultHeight: 6.25,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'furniture-bed-queen',
    name: 'Queen Bed',
    category: 'Furniture',
    description: '60"×80" queen mattress',
    defaultWidth: 5,
    defaultHeight: 6.667,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'furniture-bed-king',
    name: 'King Bed',
    category: 'Furniture',
    description: '76"×80" king mattress',
    defaultWidth: 6.333,
    defaultHeight: 6.667,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'furniture-sofa',
    name: 'Sofa',
    category: 'Furniture',
    description: '84"×34" three-seat sofa',
    defaultWidth: 7,
    defaultHeight: 2.833,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 4,
    widthPresets: [5, 6, 7, 8]
  },
  {
    id: 'furniture-chair',
    name: 'Armchair',
    category: 'Furniture',
    description: '30"×30" upholstered armchair',
    defaultWidth: 2.5,
    defaultHeight: 2.5,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'furniture-dining-table',
    name: 'Dining Table',
    category: 'Furniture',
    description: '36"×72" rectangular dining table',
    defaultWidth: 6,
    defaultHeight: 3,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 3,
    minHeight: 2.5,
    widthPresets: [4, 5, 6, 7, 8]
  },
  {
    id: 'furniture-coffee-table',
    name: 'Coffee Table',
    category: 'Furniture',
    description: '48"×24" coffee table',
    defaultWidth: 4,
    defaultHeight: 2,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 2,
    minHeight: 1.5
  },
  {
    id: 'furniture-dresser',
    name: 'Dresser',
    category: 'Furniture',
    description: '48"×18" bedroom dresser',
    defaultWidth: 4,
    defaultHeight: 1.5,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 2,
    widthPresets: [2.5, 3, 4, 5, 6]
  },
  {
    id: 'furniture-desk',
    name: 'Desk',
    category: 'Furniture',
    description: '60"×30" work desk',
    defaultWidth: 5,
    defaultHeight: 2.5,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 3,
    widthPresets: [4, 5, 6]
  },

  // ── CASEWORK ─────────────────────────────────────────────────────────────
  {
    id: 'casework-base',
    name: 'Base Cabinet',
    category: 'Casework',
    description: '24" deep base cabinet with countertop',
    defaultWidth: 6,
    defaultHeight: 2,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 1,
    widthPresets: [2, 3, 4, 5, 6, 8, 10, 12]
  },
  {
    id: 'casework-upper',
    name: 'Upper Cabinet',
    category: 'Casework',
    description: '12" deep upper wall cabinet (shown dashed)',
    defaultWidth: 6,
    defaultHeight: 1,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 1,
    widthPresets: [2, 3, 4, 5, 6, 8, 10, 12]
  },
  {
    id: 'casework-island',
    name: 'Kitchen Island',
    category: 'Casework',
    description: '48"×36" kitchen island',
    defaultWidth: 4,
    defaultHeight: 3,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 2,
    minHeight: 2
  },
  {
    id: 'casework-bath-storage',
    name: 'Bath Storage Cabinet',
    category: 'Casework',
    description: '18"×18" wall-hung bathroom storage cabinet',
    defaultWidth: 1.5,
    defaultHeight: 1.5,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 0.75,
    minHeight: 0.75
  },

  // ── STRUCTURAL ───────────────────────────────────────────────────────────
  {
    id: 'structural-column-sq',
    name: 'Square Column',
    category: 'Structural',
    description: '12"×12" structural column',
    defaultWidth: 1,
    defaultHeight: 1,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 0.5,
    minHeight: 0.5
  },
  {
    id: 'structural-column-round',
    name: 'Round Column',
    category: 'Structural',
    description: '12" diameter round column',
    defaultWidth: 1,
    defaultHeight: 1,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 0.5,
    minHeight: 0.5
  },

  // ── ANNOTATIONS ──────────────────────────────────────────────────────────
  {
    id: 'room-label',
    name: 'Room Label',
    category: 'Annotations',
    description: 'Room name and area annotation',
    defaultWidth: 8,
    defaultHeight: 6,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 3,
    minHeight: 2
  },
  {
    id: 'north-arrow',
    name: 'North Arrow',
    category: 'Annotations',
    description: 'Compass north arrow',
    defaultWidth: 2,
    defaultHeight: 2,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'fire-rating-label',
    name: 'Fire Rating Label',
    category: 'Annotations',
    description: 'Wall fire rating tag (1-HR, 2-HR, etc.)',
    defaultWidth: 3,
    defaultHeight: 0.5,
    isResizable: true,
    resizeAxis: 'x',
    minWidth: 2
  },
  {
    id: 'text-note',
    name: 'Text Note',
    category: 'Annotations',
    description: 'Free text note or callout',
    defaultWidth: 6,
    defaultHeight: 2,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 2,
    minHeight: 1
  },
  {
    id: 'human-scale',
    name: 'Scale Figure',
    category: 'Annotations',
    description: "Human figure for scale reference (~6' tall)",
    defaultWidth: 1.5,
    defaultHeight: 6,
    isResizable: false,
    resizeAxis: 'none'
  },

  // ── SHAPES ───────────────────────────────────────────────────────────────
  {
    id: 'shape-rect',
    name: 'Rectangle',
    category: 'Annotations',
    description: 'General-purpose rectangle / area shape',
    defaultWidth: 4,
    defaultHeight: 4,
    isResizable: true,
    resizeAxis: 'both',
    minWidth: 0.25,
    minHeight: 0.25
  },

  // ── FIRE/SAFETY ──────────────────────────────────────────────────────────
  {
    id: 'fire-extinguisher',
    name: 'Fire Extinguisher',
    category: 'Fire/Safety',
    description: 'Portable fire extinguisher symbol',
    defaultWidth: 0.75,
    defaultHeight: 0.75,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'exit-sign',
    name: 'Exit Sign',
    category: 'Fire/Safety',
    description: 'Illuminated EXIT sign',
    defaultWidth: 1.5,
    defaultHeight: 0.5,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'smoke-detector',
    name: 'Smoke Detector',
    category: 'Fire/Safety',
    description: 'Ceiling-mounted smoke detector',
    defaultWidth: 0.5,
    defaultHeight: 0.5,
    isResizable: false,
    resizeAxis: 'none'
  },
  {
    id: 'emergency-light',
    name: 'Emergency Light',
    category: 'Fire/Safety',
    description: 'Emergency egress lighting unit',
    defaultWidth: 0.75,
    defaultHeight: 0.75,
    isResizable: false,
    resizeAxis: 'none'
  }
]

export function getBloxById(id: string): BloxDefinition | undefined {
  return BLOX_DEFINITIONS.find(b => b.id === id)
}

export const BLOX_CATEGORIES = [
  'Walls',
  'Openings',
  'Stairs',
  'Fixtures',
  'Furniture',
  'Casework',
  'Structural',
  'Annotations',
  'Fire/Safety'
] as const
