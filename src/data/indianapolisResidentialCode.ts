// ── Indianapolis Residential Code Reference ─────────────────────────────────
//
// Indianapolis / Marion County does not maintain its own residential building
// code. New single-family/duplex construction is reviewed against the
// **Indiana Residential Code** (the ICC International Residential Code, IRC,
// as adopted and amended by the State of Indiana — administered by the
// Indiana Dept. of Homeland Security, IDHS) and permitted/inspected locally
// by Indianapolis DBNS (Dept. of Business & Neighborhood Services). Zoning
// requirements (setbacks, height, lot coverage, parking) are separate from
// the building code and come from Indianapolis/Marion County's **Unified
// Development Ordinance (UDO)**, adopted 2016, administered by DMD.
//
// This file is a paraphrased QUICK-REFERENCE, not the code text. The IRC is
// ICC copyrighted material and cannot be reproduced here; Indiana's specific
// amendments and current UDO district figures should be confirmed against
// the primary sources before relying on them for a permit submission:
//   - Indiana Residential Code (current edition + Indiana amendments): in.gov/dhs
//   - Indianapolis UDO (zoning): indy.gov/activity/unified-development-ordinance,
//     also on Municode
//   - Local plan review / permitting: Indianapolis DBNS
//
// Numbers below reflect standard IRC prescriptive values that have been
// stable across recent editions (2018/2021 IRC) and are unlikely to have
// changed materially. Anything jurisdiction- or parcel-specific (zoning
// district setbacks, local amendments) is flagged "verify" rather than
// stated as fact.

export interface CodeRefItem {
  id: string
  section: string
  title: string
  summary: string
}

export interface CodeRefGroup {
  key: string
  label: string
  source: string
  items: CodeRefItem[]
}

export const CODE_REFERENCE: CodeRefGroup[] = [
  {
    key: 'planning',
    label: 'Building Planning',
    source: 'Indiana Residential Code, Ch. 3 (IRC R301–R327)',
    items: [
      { id: 'r302.1', section: 'R302.1', title: 'Exterior wall fire separation', summary: 'Exterior walls closer than 5ft to a property line need fire-resistance rating; walls within 3ft generally can’t have openings.' },
      { id: 'r302.5', section: 'R302.5', title: 'Garage/dwelling separation', summary: 'Door between attached garage and living space must be solid-core ≥1-3/8", 20-min fire-rated, or equivalent, and self-closing. Garage needs 1/2" gypsum on the house-side wall/ceiling (5/8" Type X under habitable rooms above).' },
      { id: 'r302.13', section: 'R302.13', title: 'Fire-resistant floor assemblies', summary: 'Floor/ceiling assemblies between dwelling units (duplex, townhouse) need a fire rating and draftstopping — not applicable to a standalone SFR.' },
      { id: 'r303.1', section: 'R303.1', title: 'Light & ventilation', summary: 'Habitable rooms need natural light ≥8% of floor area and openable ventilation ≥4% of floor area, or mechanical ventilation per M1505/M1507.' },
      { id: 'r304.1', section: 'R304.1', title: 'Minimum room area', summary: 'Habitable rooms (except kitchens) must be ≥70 sq ft.' },
      { id: 'r304.2', section: 'R304.2', title: 'Minimum room dimension', summary: 'Habitable rooms must be ≥7ft in any horizontal dimension.' },
      { id: 'r305.1', section: 'R305.1', title: 'Ceiling height', summary: 'Habitable rooms, hallways, and bathrooms need ≥7–0" ceiling height (some allowances for beams/sloped ceilings).' },
      { id: 'r306.1', section: 'R306.1', title: 'Toilet room requirement', summary: 'Every dwelling needs at least one bathroom with a water closet, lavatory, and bathtub or shower.' },
      { id: 'r306.3', section: 'R306.3', title: 'Kitchen sink', summary: 'Every dwelling needs a kitchen with a sink.' },
      { id: 'r307.1', section: 'R307.1', title: 'Toilet/tub clearances', summary: 'Fixtures need minimum clearances: ≥21" clear in front of water closet/lav/tub, ≥15" from fixture centerline to any side wall/obstruction.' },
      { id: 'r310.1', section: 'R310.1', title: 'Emergency egress openings', summary: 'Every sleeping room (and basements with habitable space) needs an operable emergency escape window or exterior door.' },
      { id: 'r310.2', section: 'R310.2.1', title: 'Egress window minimums', summary: 'Net clear opening ≥5.7 sq ft (5.0 sq ft at grade floor), ≥24" clear height, ≥20" clear width, sill ≤44" above floor.' },
      { id: 'r310.2.3', section: 'R310.2.3', title: 'Window wells', summary: 'Below-grade egress windows need a window well ≥9 sq ft, ≥36" horizontal dimension; wells >44" deep need a permanent ladder or steps.' },
      { id: 'r311.2', section: 'R311.2', title: 'Egress door', summary: 'At least one exterior egress door, side-hinged, ≥3–0" wide × 6–8" high (net clear ≥32").' },
      { id: 'r311.3', section: 'R311.3', title: 'Landings at doors', summary: 'A floor or landing (min. 36" in direction of travel) is required on each side of every exterior egress door.' },
      { id: 'r311.6', section: 'R311.6', title: 'Hallways', summary: 'Hallways must be ≥3–0" wide.' },
      { id: 'r311.7.1', section: 'R311.7.1', title: 'Stairway width', summary: 'Stairways ≥36" clear width above the handrail; below the handrail, ≥31.5" (one rail) or ≥27" (two rails).' },
      { id: 'r311.7.2', section: 'R311.7.2', title: 'Headroom', summary: 'Stairways need ≥6–8" headroom, measured vertically from the tread nosing.' },
      { id: 'r311.7.5', section: 'R311.7.5', title: 'Riser & tread size', summary: 'Max riser height 7-3/4", min tread depth 10". Riser/tread variance within a flight ≤ 3/8".' },
      { id: 'r311.7.6', section: 'R311.7.6', title: 'Stair landings', summary: 'A floor or landing is required at the top and bottom of each stairway, ≥36" deep in the direction of travel and at least as wide as the stair.' },
      { id: 'r311.7.8', section: 'R311.7.8', title: 'Handrails', summary: 'Continuous handrail required on ≥1 side of stairways with 4+ risers, mounted 34"–38" above nosing, graspable profile (1-1/4"–2" circular, or equivalent).' },
      { id: 'r312.1', section: 'R312.1', title: 'Guards', summary: 'Guards required at walking surfaces >30" above grade/floor within 36" horizontally, minimum height 36" (guards on stair open sides may be 34" min).' },
      { id: 'r312.1.3', section: 'R312.1.3', title: 'Guard opening limits', summary: 'Guard balusters/openings sized so a 4" sphere cannot pass through (6" sphere for the triangular opening at stair stringer/riser/guard).' },
      { id: 'r313.2', section: 'R313.2', title: 'Fire sprinklers', summary: 'The 2020 Indiana amendments do NOT require automatic fire sprinklers in one- and two-family dwellings (Indiana struck the IRC’s R313 sprinkler mandate) — verify current status.' },
      { id: 'r314.3', section: 'R314.3', title: 'Smoke alarm locations', summary: 'Smoke alarms required in each sleeping room, outside each separate sleeping area, and on each additional story (interconnected in new construction).' },
      { id: 'r315.3', section: 'R315.3', title: 'CO alarm locations', summary: 'Carbon monoxide alarms required outside each separate sleeping area in dwellings with fuel-burning appliances or an attached garage.' },
      { id: 'r317.1', section: 'R317.1', title: 'Wood decay protection', summary: 'Wood framing in contact with ground, concrete, or within 6" of grade requires naturally durable or preservative-treated wood.' },
      { id: 'r319', section: 'R319', title: 'Site address', summary: 'Building address numbers must be visible and legible from the street.' },
      { id: 'r322', section: 'R322', title: 'Flood-resistant construction', summary: 'Structures in a designated flood hazard area (FEMA FIRM) need elevated lowest floor and flood venting per local floodplain ordinance.' },
      { id: 'r326', section: 'R326', title: 'Swimming pools, spas & hot tubs', summary: 'Pools/spas need barrier fencing ≥48" tall with self-closing/latching gates; follow ISPSC/ APSP-style barrier rules referenced by the IRC.' },
    ],
  },
  {
    key: 'foundation',
    label: 'Foundations',
    source: 'Indiana Residential Code, Ch. 4 (IRC R401–R408)',
    items: [
      { id: 'r403.1', section: 'R403.1', title: 'Footings', summary: 'Footings sized per soil-bearing capacity and load tables; min. 12" wide typical for light-frame constr. on average soil — verify with a soils report on questionable sites.' },
      { id: 'r403.1.4', section: 'R403.1.4', title: 'Frost protection depth', summary: 'Footings must bear below the frost line for the jurisdiction. Marion County typically requires footing bottoms ≥30" below finish grade — confirm with the current DBNS frost-depth bulletin.' },
      { id: 'r404.1', section: 'R404.1', title: 'Foundation wall construction', summary: 'Concrete/masonry foundation walls sized by height, soil class, and backfill per prescriptive tables, or engineered.' },
      { id: 'r405.1', section: 'R405.1', title: 'Foundation drainage', summary: 'Foundation drain (footing drain) required around foundations enclosing habitable/usable space below grade, except on well-drained sand/gravel sites.' },
      { id: 'r406.1', section: 'R406.1', title: 'Damp-proofing/waterproofing', summary: 'Below-grade concrete/masonry walls need damp-proofing (waterproofing where hydrostatic pressure is expected).' },
      { id: 'r408.1', section: 'R408.1', title: 'Under-floor (crawlspace) ventilation', summary: 'Crawlspaces need net ventilation area ≥1/150 of under-floor area (reducible with a vapor retarder / conditioned crawlspace design).' },
      { id: 'r408.3', section: 'R408.3', title: 'Crawlspace access', summary: 'Access opening ≥18"×24" (or 16"×24" through a perimeter wall).' },
    ],
  },
  {
    key: 'framing',
    label: 'Floor, Wall & Roof Framing',
    source: 'Indiana Residential Code, Ch. 5–9 (IRC R501–R908)',
    items: [
      { id: 'r502', section: 'R502', title: 'Floor joists', summary: 'Span/size/spacing per prescriptive span tables based on species, grade, and spacing (12"/16"/19.2"/24" o.c.).' },
      { id: 'r602.3', section: 'R602.3', title: 'Wall stud size/spacing', summary: '2×4 studs typically 16" o.c. for load-bearing walls (24" o.c. permitted per tables for limited conditions); 2×6 for 24" o.c. common practice.' },
      { id: 'r602.7', section: 'R602.7', title: 'Headers', summary: 'Header size/span limited by prescriptive tables per member size and building width/load (see BloxCad detail-mode span checks).' },
      { id: 'r602.10', section: 'R602.10', title: 'Wall bracing', summary: 'Braced wall lines required at prescribed spacing/percentage using an approved bracing method (let-in brace, structural sheathing, portal frame, etc.), varying by wind/seismic design category.' },
      { id: 'r703', section: 'R703', title: 'Exterior wall covering & flashing', summary: 'Water-resistive barrier required behind siding; flashing required at all openings, wall-roof intersections, and other water-shedding transitions.' },
      { id: 'r802', section: 'R802', title: 'Rafters & ceiling joists', summary: 'Sized per prescriptive span tables by species/grade/spacing and roof/ceiling load (ground snow load, dead load).' },
      { id: 'r806.2', section: 'R806.2', title: 'Attic ventilation', summary: 'Net free ventilating area ≥1/150 of attic area (1/300 with ≥50% high/low venting and a vapor retarder, or per energy code).' },
      { id: 'r807.1', section: 'R807.1', title: 'Attic access', summary: 'Attics ≥30 sq ft with ≥30" clear height need a ≥22"×30" access opening.' },
      { id: 'r905', section: 'R905', title: 'Roof coverings', summary: 'Asphalt shingles and other coverings installed per manufacturer instructions and slope minimums; ice barrier (R905.1.2) required at eaves in areas with a history of ice damming — Indianapolis is generally within the ice-barrier zone, verify current climate/geographic table.' },
      { id: 'r1001', section: 'R1001–R1003', title: 'Chimneys & fireplaces', summary: 'Masonry fireplace/chimney clearances to combustibles, hearth extension size, and cap/spark-arrestor requirements per prescriptive tables.' },
    ],
  },
  {
    key: 'energy',
    label: 'Energy Efficiency',
    source: 'Indiana Residential Code / IECC, Ch. 11 (Indianapolis is IECC Climate Zone 5)',
    items: [
      { id: 'n1102.1', section: 'N1101–N1102', title: 'Insulation & fenestration (Zone 5)', summary: 'Typical Zone 5 prescriptive minimums: ceiling R-49, wood-frame wall R-20 (or 13+5 c.i.), floor R-30, basement wall R-15/19, slab R-10, fenestration U ≤0.30, SHGC not restricted. Confirm current table — values are periodically updated.' },
      { id: 'n1103', section: 'N1103', title: 'Systems (ducts, mechanicals)', summary: 'Duct sealing, duct/pipe insulation in unconditioned space, and equipment sizing (Manual J/S) required; ducts in conditioned space are exempt from most insulation/sealing requirements.' },
      { id: 'n1104', section: 'N1104', title: 'Lighting', summary: '≥90% of permanently installed lamps must be high-efficacy.' },
      { id: 'n1105', section: 'N1105', title: 'Air leakage / blower door', summary: 'Building thermal envelope tested and verified ≤3 ACH50 (Zone 3–8) via blower-door test, or visual inspection checklist alternative.' },
    ],
  },
  {
    key: 'mechanical',
    label: 'Mechanical & Fuel Gas',
    source: 'Indiana Residential Code, Ch. 13–24 (IRC M1101–G2483)',
    items: [
      { id: 'm1305', section: 'M1305.1', title: 'Appliance access', summary: 'Clear, unobstructed access passageway ≥24" wide (30"×30" work platform) to attics/crawlspace-mounted equipment.' },
      { id: 'm1502', section: 'M1502', title: 'Clothes dryer exhaust', summary: 'Dryer exhaust ducted independently to the exterior, smooth metal duct, max developed length 35ft (reduced per fitting), no screws penetrating the duct interior.' },
      { id: 'm1503', section: 'M1503', title: 'Range hood exhaust', summary: 'Kitchen exhaust systems ducted to the exterior (recirculating allowed only where permitted); makeup air required for exhaust ≥400 CFM.' },
      { id: 'm1505', section: 'M1505', title: 'Whole-house mechanical ventilation', summary: 'Required when the building is tested tighter than 5 ACH50; continuous or intermittent system sized per occupancy/floor-area table.' },
      { id: 'g2407', section: 'G2407 (IFGC)', title: 'Combustion air', summary: 'Fuel-fired appliances need adequate combustion air per volume/opening method, or be direct-vent/sealed-combustion.' },
    ],
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    source: 'Indiana Residential Code, Ch. 25–33 (IRC P2501–P3314)',
    items: [
      { id: 'p2601', section: 'P2601', title: 'Fixture requirement', summary: 'Every dwelling requires a water closet, lavatory, tub/shower, kitchen sink, and clothes washer connection (if laundry provided).' },
      { id: 'p2705', section: 'P2705', title: 'Fixture clearances', summary: 'Water closet ≥15" from centerline to any wall/fixture/obstruction, ≥21" clear in front; lavatory ≥4" from wall or per fixture spec.' },
      { id: 'p2801', section: 'P2801', title: 'Water heaters', summary: 'Temperature/pressure relief valve required, discharge piped to within 6" of floor/exterior; seismic/tip strapping per local amendment.' },
      { id: 'p2902', section: 'P2902', title: 'Backflow prevention', summary: 'Cross-connection/backflow protection required at hose bibbs (vacuum breaker), irrigation systems, and fixtures per fixture-type table.' },
      { id: 'p3005', section: 'P3005', title: 'DWV sizing & venting', summary: 'Drain, waste, and vent pipe sizing per fixture-unit tables; every trap needs a protective vent within specified distance.' },
    ],
  },
  {
    key: 'electrical',
    label: 'Electrical',
    source: 'Indiana Residential Code / NEC as adopted, Ch. 34–43',
    items: [
      { id: 'nec110.26', section: 'NEC 110.26', title: 'Panel working clearance', summary: 'Electrical panels/service equipment need dedicated working space: 30" wide × 36" deep clear floor space centered on the panel, 6ft-8" min headroom, unobstructed floor-to-ceiling — no storage or other equipment in that zone.' },
      { id: 'e3901', section: 'E3901', title: 'Receptacle spacing', summary: 'Wall receptacles so no point along a wall is >6ft from an outlet (12ft max spacing); kitchen counters need outlets so no point is >24" from a receptacle.' },
      { id: 'e3902', section: 'E3902', title: 'GFCI protection', summary: 'GFCI required at kitchen counter, bath, garage, outdoor, crawlspace, unfinished basement, and within 6ft of a sink.' },
      { id: 'e3902.17', section: 'E3902.17', title: 'AFCI protection', summary: 'Arc-fault protection required for most 120V, 15/20A branch circuits in dwelling units (bedrooms, living areas, etc.) per current NEC table.' },
      { id: 'e3903', section: 'E3903', title: 'Branch circuits', summary: 'Dedicated 20A small-appliance circuits (kitchen/dining), dedicated laundry circuit, dedicated bathroom circuit.' },
      { id: 'e3805', section: 'E3805', title: 'Smoke alarm power', summary: 'Smoke alarms in new construction must be hardwired with battery backup and interconnected so all alarms activate together.' },
    ],
  },
  {
    key: 'zoning',
    label: 'Zoning (Indianapolis / Marion Co. UDO)',
    source: 'Indianapolis Unified Development Ordinance (UDO), adopted 2016 — administered by DMD',
    items: [
      { id: 'udo-districts', section: 'UDO Art. 3', title: 'Residential zoning districts', summary: 'The UDO uses "Single-Unit" (e.g. SU-1…SU-43, numbered by minimum lot size in thousands of SF) and "Multi-Unit" district families in place of the old D-1…D-8 dwelling districts. Confirm your parcel’s exact district via the IndyGov UDO/zoning map lookup.' },
      { id: 'udo-setback', section: 'UDO district standards table', title: 'Setbacks', summary: 'Front, side, and rear setbacks are set per district in the UDO district standards tables and can also be governed by an established "block average" front setback on infill lots. Do not assume a single number applies city-wide — pull the standards table for the specific SU district.' },
      { id: 'udo-height', section: 'UDO district standards table', title: 'Height limit', summary: 'Max building height is set per district (commonly in the 30–35ft / 2.5-story range for single-unit districts) — verify against the specific district table.' },
      { id: 'udo-coverage', section: 'UDO district standards table', title: 'Lot / impervious coverage', summary: 'Some single-unit districts cap building or impervious lot coverage as a percentage; not all districts include a coverage max — check the applicable table.' },
      { id: 'udo-accessory', section: 'UDO Art. 4', title: 'Accessory structures', summary: 'Detached garages/sheds have their own setback, height, and rear/side-yard placement rules, generally more permissive than the main structure but district-specific.' },
      { id: 'udo-parking', section: 'UDO Art. 7', title: 'Off-street parking', summary: 'Single-unit dwellings generally require off-street parking spaces per unit; exact count and driveway/apron standards are in the parking article.' },
      { id: 'udo-nonconform', section: 'UDO Art. 12', title: 'Nonconforming lots/structures', summary: 'Older lots that predate the UDO or are undersized for their district may have nonconforming rights — additions/rebuilds can trigger variance requirements.' },
    ],
  },
]

export const CODE_REFERENCE_DISCLAIMER =
  'Paraphrased quick-reference for design use — not a substitute for the adopted code text or a plan review. ' +
  'Verify against the current Indiana Residential Code (in.gov/dhs), the Indianapolis UDO (indy.gov / Municode), ' +
  'and Indianapolis DBNS before finalizing construction documents.'
