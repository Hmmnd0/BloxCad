import React from 'react'
import { BloxDefinition } from '../../types'
import { useStore } from '../../store/useStore'

interface BloxItemProps {
  def: BloxDefinition
}

// SVG thumbnails for each blox type
function BloxThumbnail({ bloxId }: { bloxId: string }) {
  const size = 40
  const s = size

  const thumb: Record<string, React.ReactNode> = {
    'wall-exterior': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={14} width={36} height={12} fill="#3C3C3C" stroke="#111" strokeWidth={0.8} />
        {[6,12,18,24,30].map(x => (
          <line key={x} x1={x} y1={14} x2={x+10} y2={26} stroke="#888" strokeWidth={0.5}/>
        ))}
      </svg>
    ),
    'wall-interior': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="#5A5A5A" stroke="#111" strokeWidth={0.8} />
      </svg>
    ),
    'wall-cmu': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={12} width={36} height={16} fill="#888" stroke="#111" strokeWidth={0.8} />
        <line x1={2} y1={20} x2={38} y2={20} stroke="#555" strokeWidth={0.5} />
        {[10,20,30].map(x => <line key={x} x1={x} y1={12} x2={x} y2={20} stroke="#555" strokeWidth={0.5}/>)}
        {[5,15,25,35].map(x => <line key={x} x1={x} y1={20} x2={x} y2={28} stroke="#555" strokeWidth={0.5}/>)}
      </svg>
    ),
    'insulation-batt': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={15} width={36} height={10} fill="rgba(255,210,40,0.15)" stroke="#8B6914" strokeWidth={0.8}/>
        {[0,1,2,3].map(i => (
          <path key={i}
            d={i % 2 === 0
              ? `M${2 + i*9},20 a4.5,5 0 0,1 9,0`
              : `M${2 + i*9},20 a4.5,5 0 0,0 9,0`}
            fill="rgba(255,200,30,0.3)" stroke="#8B6914" strokeWidth={0.8}/>
        ))}
      </svg>
    ),
    'cased-opening': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="white" stroke="none"/>
        {/* Left jamb */}
        <line x1={2} y1={16} x2={2} y2={24} stroke="#111" strokeWidth={1.5}/>
        <line x1={2} y1={16} x2={8} y2={16} stroke="#111" strokeWidth={1.5}/>
        <line x1={2} y1={24} x2={8} y2={24} stroke="#111" strokeWidth={1.5}/>
        {/* Right jamb */}
        <line x1={38} y1={16} x2={38} y2={24} stroke="#111" strokeWidth={1.5}/>
        <line x1={38} y1={16} x2={32} y2={16} stroke="#111" strokeWidth={1.5}/>
        <line x1={38} y1={24} x2={32} y2={24} stroke="#111" strokeWidth={1.5}/>
      </svg>
    ),
    'door-single': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={5} y1={5} x2={5} y2={35} stroke="#111" strokeWidth={2}/>
        <path d="M5,5 L35,5" stroke="#111" strokeWidth={2}/>
        <path d="M35,5 A30,30 0 0,0 5,35" fill="rgba(135,206,250,0.15)" stroke="#111" strokeWidth={0.8}/>
      </svg>
    ),
    'door-double': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={20} y1={5} x2={20} y2={25} stroke="#111" strokeWidth={2}/>
        <path d="M5,5 L20,5" stroke="#111" strokeWidth={2}/>
        <path d="M20,5 A15,15 0 0,0 5,20" fill="rgba(135,206,250,0.15)" stroke="#111" strokeWidth={0.8}/>
        <path d="M20,5 L35,5" stroke="#111" strokeWidth={2}/>
        <path d="M20,5 A15,15 0 0,1 35,20" fill="rgba(135,206,250,0.15)" stroke="#111" strokeWidth={0.8}/>
      </svg>
    ),
    'door-sliding': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="rgba(135,206,250,0.2)" stroke="#111" strokeWidth={0.8}/>
        <rect x={2} y={16} width={18} height={8} fill="rgba(135,206,250,0.4)" stroke="#111" strokeWidth={1.5}/>
        <line x1={8} y1={20} x2={16} y2={20} stroke="#111" strokeWidth={1}/>
        <polygon points="14,17 18,20 14,23" fill="#111"/>
      </svg>
    ),
    'window-single': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="white" stroke="#111" strokeWidth={0.8}/>
        <line x1={2} y1={18} x2={38} y2={18} stroke="#111" strokeWidth={0.4}/>
        <line x1={2} y1={20} x2={38} y2={20} stroke="#111" strokeWidth={0.8}/>
        <line x1={2} y1={22} x2={38} y2={22} stroke="#111" strokeWidth={0.4}/>
      </svg>
    ),
    'window-double': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="white" stroke="#111" strokeWidth={0.8}/>
        <rect x={19} y={16} width={2} height={8} fill="#111"/>
        <line x1={2} y1={20} x2={19} y2={20} stroke="#111" strokeWidth={0.5}/>
        <line x1={21} y1={20} x2={38} y2={20} stroke="#111" strokeWidth={0.5}/>
      </svg>
    ),
    'window-multi': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="white" stroke="#111" strokeWidth={0.8}/>
        <line x1={2} y1={20} x2={12} y2={20} stroke="#111" strokeWidth={0.5}/>
        <line x1={16} y1={20} x2={26} y2={20} stroke="#111" strokeWidth={0.5}/>
        <line x1={30} y1={20} x2={38} y2={20} stroke="#111" strokeWidth={0.5}/>
        <rect x={12} y={16} width={4} height={8} fill="#111"/>
        <rect x={26} y={16} width={4} height={8} fill="#111"/>
      </svg>
    ),
    'stairs-straight': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={5} y={5} width={30} height={30} fill="white" stroke="#111" strokeWidth={0.8}/>
        {[10,15,20,25,30].map(y=><line key={y} x1={5} y1={y} x2={35} y2={y} stroke="#555" strokeWidth={0.5}/>)}
        <line x1={20} y1={28} x2={20} y2={18} stroke="#111" strokeWidth={1}/>
        <polygon points="16,22 20,17 24,22" fill="#111"/>
      </svg>
    ),
    'stairs-elevation': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="4,36 4,30 11,30 11,23 18,23 18,16 25,16 25,9 36,9 36,36" fill="#f0f0f0" stroke="#111" strokeWidth={0.9}/>
        <line x1={4} y1={36} x2={36} y2={36} stroke="#111" strokeWidth={1.5}/>
      </svg>
    ),
    'handrail': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={4} y1={20} x2={36} y2={20} stroke="#111" strokeWidth={3} strokeLinecap="round"/>
        {[10,18,26,34].map(x=><line key={x} x1={x} y1={13} x2={x} y2={27} stroke="#111" strokeWidth={1}/>)}
      </svg>
    ),
    'fixture-toilet': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={8} y={2} width={24} height={12} rx={2} fill="white" stroke="#111" strokeWidth={0.8}/>
        <ellipse cx={20} cy={27} rx={13} ry={12} fill="white" stroke="#111" strokeWidth={0.8}/>
        <ellipse cx={20} cy={27} rx={8} ry={8} fill="#f0f0f0" stroke="#888" strokeWidth={0.5}/>
      </svg>
    ),
    'fixture-sink-lav': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={4} width={32} height={32} rx={5} fill="white" stroke="#111" strokeWidth={0.8}/>
        <ellipse cx={20} cy={22} rx={10} ry={8} fill="#f5f5f5" stroke="#888" strokeWidth={0.5}/>
        <circle cx={20} cy={10} r={3} fill="#aaa" stroke="#111" strokeWidth={0.5}/>
      </svg>
    ),
    'fixture-bathtub': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={3} width={16} height={34} rx={2} fill="white" stroke="#111" strokeWidth={0.8}/>
        <rect x={5} y={7} width={12} height={24} rx={2} fill="#f0f8ff" stroke="#aaa" strokeWidth={0.5}/>
        <circle cx={11} cy={28} r={2} fill="white" stroke="#666" strokeWidth={0.5}/>
      </svg>
    ),
    'fixture-sink-kitchen': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={8} width={36} height={24} fill="white" stroke="#111" strokeWidth={0.8}/>
        <rect x={4} y={10} width={15} height={20} rx={2} fill="#f5f5f5" stroke="#888" strokeWidth={0.5}/>
        <rect x={21} y={10} width={15} height={20} rx={2} fill="#f5f5f5" stroke="#888" strokeWidth={0.5}/>
        <circle cx={20} cy={20} r={2} fill="#aaa" stroke="#111" strokeWidth={0.5}/>
      </svg>
    ),
    'fixture-refrigerator': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={4} width={32} height={32} fill="white" stroke="#111" strokeWidth={0.8}/>
        <line x1={4} y1={4} x2={36} y2={36} stroke="#ccc" strokeWidth={0.5}/>
        <line x1={36} y1={4} x2={4} y2={36} stroke="#ccc" strokeWidth={0.5}/>
        <text x={12} y={24} fontSize="8" fill="#888">REF</text>
      </svg>
    ),
    'fixture-range': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={3} width={34} height={34} fill="white" stroke="#111" strokeWidth={0.8}/>
        {[[11,13],[29,13],[11,27],[29,27]].map(([cx,cy],i)=>(
          <circle key={i} cx={cx} cy={cy} r={6} fill="#ddd" stroke="#888" strokeWidth={0.8}/>
        ))}
      </svg>
    ),
    'fixture-dishwasher': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={3} width={34} height={34} fill="white" stroke="#111" strokeWidth={0.8}/>
        <rect x={6} y={6} width={28} height={28} rx={2} fill="#f5f5f5" stroke="#bbb" strokeWidth={0.5}/>
        <text x={11} y={24} fontSize="8" fill="#888">DW</text>
      </svg>
    ),
    'structural-column-sq': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={10} y={10} width={20} height={20} fill="#404040" stroke="#111" strokeWidth={0.8}/>
        <line x1={10} y1={10} x2={30} y2={30} stroke="#666" strokeWidth={0.5}/>
        <line x1={30} y1={10} x2={10} y2={30} stroke="#666" strokeWidth={0.5}/>
      </svg>
    ),
    'structural-column-round': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={16} fill="#404040" stroke="#111" strokeWidth={0.8}/>
        <circle cx={20} cy={20} r={9} fill="#555" stroke="#666" strokeWidth={0.4}/>
      </svg>
    ),
    'room-label': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={5} width={34} height={30} fill="none" stroke="#aaa" strokeWidth={0.8} strokeDasharray="3 2" rx="1"/>
        <text x={20} y={22} textAnchor="middle" fontSize="8" fill="#aaa" fontFamily="sans-serif">Room</text>
        <text x={20} y={30} textAnchor="middle" fontSize="6" fill="#777" fontFamily="sans-serif">Label</text>
      </svg>
    ),
    'north-arrow': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={16} fill="white" stroke="#444" strokeWidth={1}/>
        <polygon points="20,5 23,20 20,23 17,20" fill="#222"/>
        <polygon points="20,35 17,20 20,23 23,20" fill="none" stroke="#222" strokeWidth={1}/>
        <text x={20} y={10} textAnchor="middle" fontSize="7" fill="#222" fontFamily="sans-serif" fontWeight="bold">N</text>
      </svg>
    ),
    'fire-rating-label': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={14} width={36} height={12} fill="rgba(220,30,30,0.1)" stroke="#CC0000" strokeWidth={1.5} rx="2"/>
        <text x={20} y={24} textAnchor="middle" fontSize="8" fill="#CC0000" fontFamily="sans-serif" fontWeight="bold">1-HR</text>
      </svg>
    ),
    'text-note': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={5} width={34} height={30} fill="none" stroke="#888" strokeWidth={0.8} strokeDasharray="3 2"/>
        <text x={7} y={17} fontSize="7" fill="#555" fontFamily="sans-serif">Note</text>
        <line x1={7} y1={22} x2={33} y2={22} stroke="#aaa" strokeWidth={0.5}/>
        <line x1={7} y1={27} x2={26} y2={27} stroke="#aaa" strokeWidth={0.5}/>
      </svg>
    ),
    'fire-extinguisher': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={14} fill="rgba(220,30,30,0.15)" stroke="#CC0000" strokeWidth={1.5}/>
        <text x={20} y={24} textAnchor="middle" fontSize="10" fill="#CC0000" fontFamily="sans-serif" fontWeight="bold">FE</text>
      </svg>
    ),
    'exit-sign': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={12} width={36} height={16} fill="rgba(0,180,0,0.15)" stroke="#006600" strokeWidth={1.2} rx="1"/>
        <text x={20} y={24} textAnchor="middle" fontSize="9" fill="#006600" fontFamily="sans-serif" fontWeight="bold">EXIT</text>
      </svg>
    ),
    'smoke-detector': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={14} fill="white" stroke="#444" strokeWidth={1}/>
        <circle cx={20} cy={20} r={6} fill="#444"/>
        <text x={20} y={36} textAnchor="middle" fontSize="6" fill="#666" fontFamily="sans-serif">SD</text>
      </svg>
    ),
    'emergency-light': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={4} width={32} height={32} fill="rgba(255,200,0,0.2)" stroke="#996600" strokeWidth={1} rx="2"/>
        <polygon points="23,6 15,20 19,20 17,34 25,20 21,20" fill="#996600"/>
      </svg>
    ),
    // ── Furniture ──
    'furniture-bed-twin': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={5} y={3} width={30} height={34} fill="white" stroke="#111" strokeWidth={0.8} rx="1"/>
        <rect x={5} y={3} width={30} height={6} fill="#d0c8bc" stroke="#111" strokeWidth={0.6} rx="1"/>
        <rect x={7} y={11} width={12} height={6} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} rx="2"/>
        <rect x={21} y={11} width={12} height={6} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} rx="2"/>
        <line x1={7} y1={22} x2={33} y2={22} stroke="#ccc" strokeWidth={0.8}/>
      </svg>
    ),
    'furniture-bed-full': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={3} width={32} height={34} fill="white" stroke="#111" strokeWidth={0.8} rx="1"/>
        <rect x={4} y={3} width={32} height={6} fill="#d0c8bc" stroke="#111" strokeWidth={0.6} rx="1"/>
        <rect x={6} y={11} width={13} height={6} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} rx="2"/>
        <rect x={21} y={11} width={13} height={6} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} rx="2"/>
        <line x1={6} y1={22} x2={34} y2={22} stroke="#ccc" strokeWidth={0.8}/>
      </svg>
    ),
    'furniture-bed-queen': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={2} width={34} height={36} fill="white" stroke="#111" strokeWidth={0.8} rx="1"/>
        <rect x={3} y={2} width={34} height={6} fill="#d0c8bc" stroke="#111" strokeWidth={0.6} rx="1"/>
        <rect x={5} y={10} width={14} height={7} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} rx="2"/>
        <rect x={21} y={10} width={14} height={7} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} rx="2"/>
        <line x1={5} y1={22} x2={35} y2={22} stroke="#ccc" strokeWidth={0.8}/>
      </svg>
    ),
    'furniture-bed-king': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="white" stroke="#111" strokeWidth={0.8} rx="1"/>
        <rect x={2} y={2} width={36} height={6} fill="#d0c8bc" stroke="#111" strokeWidth={0.6} rx="1"/>
        <rect x={4} y={10} width={15} height={7} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} rx="2"/>
        <rect x={21} y={10} width={15} height={7} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} rx="2"/>
        <line x1={4} y1={22} x2={36} y2={22} stroke="#ccc" strokeWidth={0.8}/>
      </svg>
    ),
    'furniture-sofa': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={8} width={36} height={26} fill="#e8e0d4" stroke="#111" strokeWidth={0.8} rx="2"/>
        <rect x={5} y={8} width={30} height={9} fill="#d4ccc0" stroke="#aaa" strokeWidth={0.6} rx="1"/>
        <rect x={5} y={17} width={30} height={17} fill="#ece6dc" stroke="#aaa" strokeWidth={0.5}/>
        <line x1={17} y1={17} x2={17} y2={34} stroke="#bbb" strokeWidth={0.8}/>
        <line x1={28} y1={17} x2={28} y2={34} stroke="#bbb" strokeWidth={0.8}/>
      </svg>
    ),
    'furniture-chair': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={4} width={32} height={32} fill="#e8e0d4" stroke="#111" strokeWidth={0.8} rx="2"/>
        <rect x={7} y={4} width={26} height={11} fill="#d4ccc0" stroke="#aaa" strokeWidth={0.6} rx="1"/>
        <rect x={7} y={15} width={26} height={21} fill="#ece6dc" stroke="#aaa" strokeWidth={0.5} rx="1"/>
      </svg>
    ),
    'furniture-dining-table': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={6} width={34} height={28} fill="#f5f0e8" stroke="#111" strokeWidth={0.8} rx="1"/>
        <rect x={6} y={9} width={28} height={22} fill="none" stroke="#bbb" strokeWidth={0.5} rx="1"/>
      </svg>
    ),
    'furniture-coffee-table': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={10} width={34} height={20} fill="#f0ece4" stroke="#111" strokeWidth={0.8} rx="2"/>
        <rect x={6} y={13} width={28} height={14} fill="none" stroke="#ccc" strokeWidth={0.5} rx="1"/>
      </svg>
    ),
    'furniture-desk': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={8} width={36} height={24} fill="#f0ece4" stroke="#111" strokeWidth={0.8}/>
        <rect x={4} y={10} width={32} height={20} fill="none" stroke="#ccc" strokeWidth={0.5}/>
        <line x1={8} y1={20} x2={32} y2={20} stroke="#bbb" strokeWidth={0.8}/>
      </svg>
    ),
    // ── Casework ──
    'casework-base': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={8} width={36} height={24} fill="white" stroke="#111" strokeWidth={1.2}/>
        <line x1={2} y1={28} x2={38} y2={28} stroke="#111" strokeWidth={0.8}/>
        <line x1={13} y1={8} x2={13} y2={28} stroke="#aaa" strokeWidth={0.6}/>
        <line x1={27} y1={8} x2={27} y2={28} stroke="#aaa" strokeWidth={0.6}/>
      </svg>
    ),
    'casework-upper': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={10} width={36} height={20} fill="rgba(200,200,200,0.1)" stroke="#111" strokeWidth={0.8} strokeDasharray="4 2"/>
        <line x1={2} y1={10} x2={38} y2={30} stroke="#ccc" strokeWidth={0.5}/>
        <line x1={38} y1={10} x2={2} y2={30} stroke="#ccc" strokeWidth={0.5}/>
      </svg>
    ),
    'casework-island': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={6} width={32} height={28} fill="white" stroke="#111" strokeWidth={1.2}/>
        <rect x={7} y={9} width={26} height={22} fill="none" stroke="#aaa" strokeWidth={0.5}/>
      </svg>
    )
  }

  return (
    <div className="flex items-center justify-center w-10 h-10 shrink-0">
      {thumb[bloxId] ?? (
        <div className="w-8 h-8 bg-gray-500 rounded" />
      )}
    </div>
  )
}

export function BloxItem({ def }: BloxItemProps) {
  const { activeBloxId, setActiveBlox, project } = useStore()
  const isActive = activeBloxId === def.id

  if (!project) return null

  return (
    <button
      onClick={() => setActiveBlox(isActive ? null : def.id)}
      className={`
        w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors
        ${isActive
          ? 'bg-accent text-white'
          : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
        }
      `}
      title={def.description}
    >
      <BloxThumbnail bloxId={def.id} />
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">{def.name}</div>
        <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
          {def.defaultWidth}′ × {def.defaultHeight < 1
            ? `${Math.round(def.defaultHeight * 12)}″`
            : `${def.defaultHeight}′`}
        </div>
      </div>
    </button>
  )
}
