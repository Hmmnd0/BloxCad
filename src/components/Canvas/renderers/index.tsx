export type { RendererProps, RendererComponent } from './shared'

import { WALLS_RENDERERS } from './walls'
import { DETAILS_RENDERERS } from './details'
import { OPENINGS_RENDERERS } from './openings'
import { STAIRS_RENDERERS } from './stairs'
import { FIXTURES_RENDERERS } from './fixtures'
import { STRUCTURAL_RENDERERS } from './structural'
import { ANNOTATIONS_RENDERERS } from './annotations'
import { FIRE_SAFETY_RENDERERS } from './fireSafety'
import { SHAPES_RENDERERS } from './shapes'
import { FURNITURE_RENDERERS } from './furniture'
import { CASEWORK_RENDERERS } from './casework'
import { ELEVATION_RENDERERS } from './elevation'
import { SITE_RENDERERS } from './site'
import { MEP_RENDERERS } from './mep'
import { LOW_VOLTAGE_RENDERERS } from './lowVoltage'

import type { RendererComponent } from './shared'
import { DEMOLITION_IDS, demolitionGeometry } from '../../../utils/demolitionGeometry'
import { refinedFixture } from './RefinedFixture'

export const RENDERERS: Record<string, RendererComponent> = {
  ...Object.fromEntries([...DEMOLITION_IDS].map(id=>[id,refinedFixture(id,demolitionGeometry)])),
  ...WALLS_RENDERERS,
  ...DETAILS_RENDERERS,
  ...OPENINGS_RENDERERS,
  ...STAIRS_RENDERERS,
  ...FIXTURES_RENDERERS,
  ...STRUCTURAL_RENDERERS,
  ...ANNOTATIONS_RENDERERS,
  ...FIRE_SAFETY_RENDERERS,
  ...SHAPES_RENDERERS,
  ...FURNITURE_RENDERERS,
  ...CASEWORK_RENDERERS,
  ...ELEVATION_RENDERERS,
  ...SITE_RENDERERS,
  ...MEP_RENDERERS,
  ...LOW_VOLTAGE_RENDERERS,
}
