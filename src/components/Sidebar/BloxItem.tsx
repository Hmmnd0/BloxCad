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
    ),
    // ── Elevation ──
    'elev-wall-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={8} width={36} height={24} fill="#CDCDCD" stroke="#333" strokeWidth={1.2}/>
      </svg>
    ),
    'elev-cantilever-slab': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={14} width={36} height={14} fill="#A0A0A0" stroke="#222" strokeWidth={1.5}/>
        <rect x={2} y={23} width={36} height={5} fill="#1C1C1C"/>
        <line x1={36} y1={14} x2={36} y2={28} stroke="#555" strokeWidth={1}/>
      </svg>
    ),
    'elev-pier': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={14} y={3} width={12} height={34} fill="#909090" stroke="#222" strokeWidth={1.5}/>
        <line x1={18} y1={3} x2={18} y2={37} stroke="#777" strokeWidth={0.5}/>
        <line x1={22} y1={3} x2={22} y2={37} stroke="#777" strokeWidth={0.5}/>
      </svg>
    ),
    'elev-ribbon-window': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={13} width={36} height={14} fill="#4A6E7E" stroke="#333" strokeWidth={1.2}/>
        <rect x={4} y={15} width={32} height={10} fill="rgba(176,210,228,0.55)" stroke="#4A6E7E" strokeWidth={0.5}/>
        <line x1={14} y1={15} x2={14} y2={25} stroke="#4A6E7E" strokeWidth={1}/>
        <line x1={26} y1={15} x2={26} y2={25} stroke="#4A6E7E" strokeWidth={1}/>
      </svg>
    ),
    'elev-window-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={10} y={3} width={20} height={34} fill="#4A6E7E" stroke="#333" strokeWidth={1.5}/>
        <rect x={13} y={6} width={14} height={24} fill="rgba(176,210,228,0.55)" stroke="#4A6E7E" strokeWidth={0.5}/>
        <rect x={10} y={30} width={20} height={5} fill="#ADADAD" stroke="#555" strokeWidth={0.5}/>
        <line x1={20} y1={6} x2={20} y2={30} stroke="#4A6E7E" strokeWidth={1}/>
      </svg>
    ),
    'elev-door-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={10} y={2} width={20} height={36} fill="#B0B0B0" stroke="#222" strokeWidth={1.2}/>
        <rect x={12} y={4} width={16} height={29} fill="#D4D4D4" stroke="#555" strokeWidth={0.7}/>
        <line x1={12} y1={14} x2={28} y2={14} stroke="#888" strokeWidth={0.7}/>
        <line x1={12} y1={22} x2={28} y2={22} stroke="#888" strokeWidth={0.7}/>
        <rect x={10} y={36} width={20} height={2} fill="#888"/>
      </svg>
    ),
    'elev-curtain-wall': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="rgba(176,210,228,0.5)" stroke="#333" strokeWidth={1.5}/>
        <line x1={14} y1={2} x2={14} y2={38} stroke="#4A6E7E" strokeWidth={1.5}/>
        <line x1={26} y1={2} x2={26} y2={38} stroke="#4A6E7E" strokeWidth={1.5}/>
        <line x1={2} y1={14} x2={38} y2={14} stroke="#4A6E7E" strokeWidth={1}/>
        <line x1={2} y1={26} x2={38} y2={26} stroke="#4A6E7E" strokeWidth={1}/>
      </svg>
    ),
    'elev-grade-line': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={10} width={36} height={22} fill="#C8B98A" stroke="#555" strokeWidth={0.8}/>
        <line x1={-4} y1={10} x2={20} y2={32} stroke="#8B7355" strokeWidth={0.7}/>
        <line x1={4} y1={10} x2={28} y2={32} stroke="#8B7355" strokeWidth={0.7}/>
        <line x1={12} y1={10} x2={36} y2={32} stroke="#8B7355" strokeWidth={0.7}/>
        <line x1={20} y1={10} x2={44} y2={32} stroke="#8B7355" strokeWidth={0.7}/>
        <line x1={28} y1={10} x2={52} y2={32} stroke="#8B7355" strokeWidth={0.7}/>
        <line x1={2} y1={10} x2={38} y2={10} stroke="#333" strokeWidth={2.5}/>
      </svg>
    ),
    'elev-shadow-band': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={15} width={36} height={10} fill="#1A1A1A" stroke="#111" strokeWidth={0.5}/>
      </svg>
    ),
    'elev-parapet': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={8} width={36} height={24} fill="#ADADAD" stroke="#333" strokeWidth={1.2}/>
        <rect x={2} y={8} width={36} height={6} fill="#888" stroke="#333" strokeWidth={0.8}/>
      </svg>
    ),
    // ── Walls (continued) ──
    'wall-glazing': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="#C8E0F0" stroke="#111" strokeWidth={0.8}/>
        <rect x={14} y={16} width={2} height={8} fill="#4A6A80"/>
        <rect x={26} y={16} width={2} height={8} fill="#4A6A80"/>
      </svg>
    ),
    // ── Details ──
    'detail-drywall': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="#F5F3EE" stroke="#111" strokeWidth={0.8}/>
        {[6,11,16,21,26,31,36].map(x => <circle key={x} cx={x} cy={20} r={0.8} fill="#555"/>)}
      </svg>
    ),
    'detail-stud-2x4': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={10} y={8} width={20} height={24} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={10} y1={8} x2={30} y2={32} stroke="#8B7340" strokeWidth={0.8}/>
        <line x1={30} y1={8} x2={10} y2={32} stroke="#8B7340" strokeWidth={0.8}/>
      </svg>
    ),
    // ── Stairs (continued) ──
    'stairs-landing': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={4} width={32} height={32} fill="white" stroke="#111" strokeWidth={1.2}/>
        <line x1={4} y1={4} x2={36} y2={36} stroke="#ccc" strokeWidth={0.6}/>
        <line x1={36} y1={4} x2={4} y2={36} stroke="#ccc" strokeWidth={0.6}/>
        <text x={20} y={23} textAnchor="middle" fontSize="7" fill="#888" fontFamily="sans-serif">LDG</text>
      </svg>
    ),
    'stairs-hatch': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={4} width={32} height={32} fill="#E8E4DC" stroke="#111" strokeWidth={1.2}/>
        {[-4,4,12,20,28,36].map(x=><line key={x} x1={x} y1={4} x2={x+32} y2={36} stroke="#AAA49C" strokeWidth={0.8}/>)}
        {[11,18,25].map(y=><line key={y} x1={4} y1={y} x2={36} y2={y} stroke="#111" strokeWidth={1}/>)}
        <line x1={20} y1={10} x2={20} y2={28} stroke="#444" strokeWidth={1.5}/>
        <polygon points="16,24 20,30 24,24" fill="#444"/>
      </svg>
    ),
    // ── Elevator + Ramp ──
    'fixture-elevator': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="white" stroke="#555" strokeWidth={1.2}/>
        <line x1={2} y1={2} x2={38} y2={38} stroke="#bbb" strokeWidth={0.7}/>
        <line x1={38} y1={2} x2={2} y2={38} stroke="#bbb" strokeWidth={0.7}/>
        <line x1={2} y1={38} x2={13} y2={38} stroke="#555" strokeWidth={1.5}/>
        <line x1={27} y1={38} x2={38} y2={38} stroke="#555" strokeWidth={1.5}/>
        <line x1={13} y1={36} x2={13} y2={40} stroke="#555" strokeWidth={0.9}/>
        <line x1={27} y1={36} x2={27} y2={40} stroke="#555" strokeWidth={0.9}/>
      </svg>
    ),
    'fixture-ramp': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="white" stroke="#555" strokeWidth={1.2}/>
        {[10,17,24,31].map(y=><line key={y} x1={4} y1={y} x2={36} y2={y} stroke="#e0e0e0" strokeWidth={0.5}/>)}
        <line x1={20} y1={8} x2={20} y2={30} stroke="#555" strokeWidth={1.2}/>
        <polygon points="15,26 20,33 25,26" fill="#555"/>
        <text x={15} y={8} fontSize="6" fill="#555" fontFamily="sans-serif">UP</text>
      </svg>
    ),
    // ── Fixtures (continued) ──
    'fixture-vanity': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={6} width={36} height={28} fill="white" stroke="#111" strokeWidth={1.2}/>
        <line x1={2} y1={11} x2={38} y2={11} stroke="#111" strokeWidth={0.8}/>
        <ellipse cx={20} cy={24} rx={10} ry={8} fill="#f0f8ff" stroke="#888" strokeWidth={0.7}/>
        <circle cx={20} cy={14} r={2} fill="#bbb" stroke="#111" strokeWidth={0.5}/>
      </svg>
    ),
    // ── Furniture (continued) ──
    'furniture-dresser': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={8} width={36} height={24} fill="white" stroke="#111" strokeWidth={1.2}/>
        <rect x={2} y={8} width={36} height={4} fill="#d8d4cf" stroke="#111" strokeWidth={0.5}/>
        <line x1={14} y1={12} x2={14} y2={32} stroke="#aaa" strokeWidth={0.6}/>
        <line x1={26} y1={12} x2={26} y2={32} stroke="#aaa" strokeWidth={0.6}/>
        <rect x={6} y={19} width={8} height={3} fill="#bbb" stroke="#999" strokeWidth={0.5} rx="1"/>
        <rect x={17} y={19} width={8} height={3} fill="#bbb" stroke="#999" strokeWidth={0.5} rx="1"/>
        <rect x={28} y={19} width={8} height={3} fill="#bbb" stroke="#999" strokeWidth={0.5} rx="1"/>
      </svg>
    ),
    // ── Casework (continued) ──
    'casework-bath-storage': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={4} width={32} height={32} fill="rgba(200,200,200,0.08)" stroke="#111" strokeWidth={0.8} strokeDasharray="4 2"/>
        <line x1={4} y1={20} x2={36} y2={20} stroke="#bbb" strokeWidth={0.6}/>
      </svg>
    ),
    // ── Structural ──
    'structural-fireplace': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={4} width={36} height={32} fill="#7A756A" stroke="#4A4540" strokeWidth={1}/>
        {[0,1,2].map(r=>[0,1,2,3,4].map(c=><rect key={`${r}${c}`} x={2+c*8+(r%2)*4} y={4+r*7} width={7} height={6} fill="#8A8078" stroke="#4A4540" strokeWidth={0.4}/>))}
        <rect x={12} y={18} width={16} height={14} fill="#111" stroke="#333" strokeWidth={1}/>
      </svg>
    ),
    'structural-masonry-mass': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={4} width={36} height={32} fill="#8A8278" stroke="#55504A" strokeWidth={1}/>
        {[0,1,2,3].map(r=>[0,1,2].map(c=><rect key={`${r}${c}`} x={2+c*13+(r%2)*6} y={4+r*8} width={12} height={7} fill="#968E84" stroke="#55504A" strokeWidth={0.4}/>))}
      </svg>
    ),
    // ── Annotations ──
    'terrace-edge': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={14} width={36} height={12} fill="#F0EDE8"/>
        <line x1={2} y1={14} x2={38} y2={14} stroke="#111" strokeWidth={2.5}/>
        <line x1={2} y1={26} x2={38} y2={26} stroke="#111" strokeWidth={1.5} strokeDasharray="6 3"/>
        <line x1={2} y1={14} x2={2} y2={26} stroke="#111" strokeWidth={1}/>
        <line x1={38} y1={14} x2={38} y2={26} stroke="#111" strokeWidth={1}/>
      </svg>
    ),
    'human-scale': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={5} r={3} fill="none" stroke="#111" strokeWidth={1}/>
        <line x1={20} y1={8} x2={20} y2={26} stroke="#111" strokeWidth={1}/>
        <line x1={10} y1={14} x2={30} y2={14} stroke="#111" strokeWidth={1}/>
        <line x1={20} y1={26} x2={12} y2={38} stroke="#111" strokeWidth={1}/>
        <line x1={20} y1={26} x2={28} y2={38} stroke="#111" strokeWidth={1}/>
      </svg>
    ),
    'annotation-leader': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={4} y1={22} x2={36} y2={22} stroke="#111" strokeWidth={1.2}/>
        <polygon points="4,22 12,18 12,26" fill="#111"/>
        <text x={14} y={19} fontSize="7" fill="#111" fontFamily="sans-serif">Label</text>
      </svg>
    ),
    'annotation-section-cut': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={10} y1={20} x2={30} y2={20} stroke="#111" strokeWidth={2} strokeDasharray="5 3"/>
        <circle cx={6} cy={20} r={5} fill="white" stroke="#111" strokeWidth={1.2}/>
        <text x={6} y={23} textAnchor="middle" fontSize="6" fill="#111" fontFamily="sans-serif">A</text>
        <circle cx={34} cy={20} r={5} fill="white" stroke="#111" strokeWidth={1.2}/>
        <text x={34} y={23} textAnchor="middle" fontSize="6" fill="#111" fontFamily="sans-serif">A</text>
      </svg>
    ),
    'annotation-grid-bubble': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={20} y1={14} x2={20} y2={38} stroke="#555" strokeWidth={1} strokeDasharray="4 3"/>
        <circle cx={20} cy={8} r={7} fill="white" stroke="#111" strokeWidth={1.2}/>
        <text x={20} y={11} textAnchor="middle" fontSize="7" fill="#111" fontFamily="sans-serif">A</text>
      </svg>
    ),
    'annotation-break-line': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polyline points="2,20 9,20 13,14 17,26 21,14 25,20 38,20" fill="none" stroke="#111" strokeWidth={1.2}/>
      </svg>
    ),
    'annotation-elevation-marker': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={16} fill="white" stroke="#111" strokeWidth={1.2}/>
        <line x1={20} y1={20} x2={33} y2={20} stroke="#111" strokeWidth={1.5}/>
        <polygon points="33,20 27,17 27,23" fill="#111"/>
        <text x={20} y={17} textAnchor="middle" fontSize="7" fill="#111" fontFamily="sans-serif">1</text>
      </svg>
    ),
    'annotation-detail-bubble': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={16} fill="white" stroke="#111" strokeWidth={1.2}/>
        <line x1={5} y1={20} x2={35} y2={20} stroke="#111" strokeWidth={0.8}/>
        <text x={20} y={17} textAnchor="middle" fontSize="8" fill="#111" fontFamily="sans-serif" fontWeight="bold">1</text>
        <text x={20} y={29} textAnchor="middle" fontSize="6" fill="#111" fontFamily="sans-serif">A-1</text>
      </svg>
    ),
    'annotation-revision-cloud': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <path d="M20,5 Q28,3 33,9 Q39,14 37,22 Q39,30 32,34 Q26,39 20,36 Q13,39 8,34 Q2,30 3,22 Q1,14 7,9 Q12,3 20,5Z" fill="none" stroke="#111" strokeWidth={1.2}/>
      </svg>
    ),
    'annotation-slope-arrow': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <text x={20} y={14} fontSize={8} textAnchor="middle" fill="#111" fontFamily="sans-serif">1:12</text>
        <line x1={3} y1={24} x2={31} y2={24} stroke="#111" strokeWidth={1}/>
        <polygon points="30,20 38,24 30,28" fill="#111"/>
      </svg>
    ),
    'annotation-accessible': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={3} width={34} height={34} rx={5} fill="#1E6BB8"/>
        <circle cx={21} cy={10} r={3} fill="white"/>
        <path d="M21,13 L21,23 L29,23 L29,29" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        <line x1={21} y1={17} x2={27} y2={17} stroke="white" strokeWidth={2} strokeLinecap="round"/>
        <path d="M14,17 A9,9 0 1,0 26,31" fill="none" stroke="white" strokeWidth={2}/>
      </svg>
    ),
    'structural-plumbing-chase': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={10} width={32} height={20} fill="white" stroke="#111" strokeWidth={1.5}/>
        {[0,8,16,24,32].map(x=><line key={x} x1={4+x-6} y1={10} x2={4+x+14} y2={30} stroke="#999" strokeWidth={0.5}/>)}
        {[0,8,16,24,32].map(x=><line key={`r${x}`} x1={4+x+14} y1={10} x2={4+x-6} y2={30} stroke="#999" strokeWidth={0.5}/>)}
        <rect x={4} y={10} width={32} height={20} fill="none" stroke="#111" strokeWidth={1.5}/>
      </svg>
    ),
    'site-tree': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={16} fill="none" stroke="#111" strokeWidth={1}/>
        {[0,1,2,3,4,5,6,7].map(i=>{
          const a = (i/8)*Math.PI*2 + 0.3
          const len = [15,11,14,10,15,12,13,10][i]
          return <line key={i} x1={20+Math.cos(a)*2} y1={20+Math.sin(a)*2} x2={20+Math.cos(a)*len} y2={20+Math.sin(a)*len} stroke="#111" strokeWidth={0.7}/>
        })}
        <circle cx={20} cy={20} r={1.5} fill="#111"/>
      </svg>
    ),
    'site-shrub': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <path d="M20,5 Q27,2 31,9 Q38,11 35,19 Q39,26 32,30 Q30,38 21,35 Q13,39 9,31 Q1,28 5,20 Q2,12 10,10 Q13,2 20,5Z" fill="none" stroke="#111" strokeWidth={1}/>
      </svg>
    ),
    'site-parking-stall': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={4} width={32} height={32} fill="none" stroke="#111" strokeWidth={1.2}/>
        <line x1={15} y1={4} x2={15} y2={36} stroke="#111" strokeWidth={1}/>
        <line x1={26} y1={4} x2={26} y2={36} stroke="#111" strokeWidth={1}/>
      </svg>
    ),
    'site-property-line': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <text x={20} y={16} fontSize={8} textAnchor="middle" fill="#111" fontFamily="sans-serif">PL</text>
        <line x1={2} y1={24} x2={38} y2={24} stroke="#111" strokeWidth={1.4} strokeDasharray="9 3 2 3"/>
      </svg>
    ),
    'site-sidewalk': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={12} width={34} height={16} fill="none" stroke="#111" strokeWidth={0.8}/>
        <line x1={14} y1={12} x2={14} y2={28} stroke="#999" strokeWidth={0.7}/>
        <line x1={26} y1={12} x2={26} y2={28} stroke="#999" strokeWidth={0.7}/>
        {[[7,16],[10,24],[18,15],[21,25],[30,17],[33,23],[8,21],[29,26]].map(([x,y],i)=>
          <rect key={i} x={x} y={y} width={1} height={1} fill="#AAA"/>)}
      </svg>
    ),
    'site-contour': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <path d="M2,22 Q8,12 14,20" fill="none" stroke="#111" strokeWidth={0.8}/>
        <path d="M26,20 Q32,28 38,18" fill="none" stroke="#111" strokeWidth={0.8}/>
        <text x={20} y={23} fontSize={7} textAnchor="middle" fill="#111" fontFamily="sans-serif">100</text>
      </svg>
    ),
    'shape-rect': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={8} width={32} height={24} fill="rgba(255,255,255,0.6)" stroke="#111" strokeWidth={1}/>
      </svg>
    ),
    'shape-polygon': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="20,4 36,14 32,34 8,34 4,14" fill="rgba(255,255,255,0.6)" stroke="#111" strokeWidth={1}/>
      </svg>
    ),
    // ── Elevation windows ──
    'elev-window-double-hung': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={8} y={2} width={24} height={36} fill="#5C5040" stroke="#2A2A2A" strokeWidth={1.2}/>
        <rect x={11} y={5} width={18} height={13} fill="rgba(176,210,228,0.55)" stroke="#3A4E60" strokeWidth={0.6}/>
        <line x1={20} y1={5} x2={20} y2={18} stroke="#4A6070" strokeWidth={1}/>
        <rect x={11} y={18} width={18} height={3} fill="#4A6070"/>
        <rect x={11} y={21} width={18} height={13} fill="rgba(176,210,228,0.55)" stroke="#3A4E60" strokeWidth={0.6}/>
        <line x1={20} y1={21} x2={20} y2={34} stroke="#4A6070" strokeWidth={1}/>
        <rect x={6} y={34} width={28} height={4} fill="#C0C0C0" stroke="#888" strokeWidth={0.5}/>
      </svg>
    ),
    'elev-window-single-hung': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={8} y={2} width={24} height={36} fill="#5C5040" stroke="#2A2A2A" strokeWidth={1.2}/>
        <rect x={11} y={5} width={18} height={13} fill="rgba(176,210,228,0.55)" stroke="#3A4E60" strokeWidth={0.6}/>
        <line x1={20} y1={5} x2={20} y2={18} stroke="#4A6070" strokeWidth={1}/>
        <line x1={11} y1={12} x2={29} y2={12} stroke="#4A6070" strokeWidth={0.8}/>
        <rect x={11} y={18} width={18} height={3} fill="#4A6070"/>
        <rect x={11} y={21} width={18} height={13} fill="rgba(176,210,228,0.55)" stroke="#3A4E60" strokeWidth={0.6}/>
        <line x1={20} y1={21} x2={20} y2={34} stroke="#4A6070" strokeWidth={1}/>
        <rect x={6} y={34} width={28} height={4} fill="#C0C0C0" stroke="#888" strokeWidth={0.5}/>
      </svg>
    ),
    'elev-window-casement': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={8} y={2} width={24} height={36} fill="#5C5040" stroke="#2A2A2A" strokeWidth={1.2}/>
        <rect x={11} y={5} width={18} height={28} fill="rgba(176,210,228,0.55)" stroke="#3A4E60" strokeWidth={0.6}/>
        <path d="M11,19 A14,14 0 0,1 25,5" fill="none" stroke="rgba(74,96,112,0.5)" strokeWidth={0.9} strokeDasharray="3 2"/>
        <circle cx={27} cy={19} r={2} fill="#999" stroke="#666" strokeWidth={0.6}/>
        <rect x={6} y={33} width={28} height={4} fill="#C0C0C0" stroke="#888" strokeWidth={0.5}/>
      </svg>
    ),
    'elev-window-fixed': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={6} y={2} width={28} height={36} fill="#5C5040" stroke="#2A2A2A" strokeWidth={1.2}/>
        <rect x={9} y={5} width={22} height={28} fill="rgba(176,210,228,0.6)" stroke="#3A4E60" strokeWidth={0.6}/>
        <line x1={10} y1={6} x2={18} y2={6} stroke="rgba(255,255,255,0.35)" strokeWidth={1.2}/>
        <line x1={10} y1={6} x2={10} y2={12} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8}/>
        <rect x={6} y={33} width={28} height={5} fill="#C0C0C0" stroke="#888" strokeWidth={0.5}/>
      </svg>
    ),
    'elev-window-arched': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <path d="M8,38 L8,20 A12,12 0 0,1 32,20 L32,38Z" fill="#5C5040" stroke="#2A2A2A" strokeWidth={1.2}/>
        <path d="M11,38 L11,20 A9,9 0 0,1 29,20 L29,38Z" fill="rgba(176,210,228,0.55)"/>
        <line x1={20} y1={11} x2={20} y2={28} stroke="#4A6070" strokeWidth={0.8}/>
        <line x1={20} y1={11} x2={11} y2={24} stroke="#4A6070" strokeWidth={0.8}/>
        <line x1={20} y1={11} x2={29} y2={24} stroke="#4A6070" strokeWidth={0.8}/>
        <rect x={4} y={35} width={32} height={4} fill="#C0C0C0" stroke="#888" strokeWidth={0.5}/>
      </svg>
    ),
    'elev-window-surround': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={3} width={7} height={34} fill="#C2B09A" stroke="#7A6A58" strokeWidth={0.6}/>
        <rect x={30} y={3} width={7} height={34} fill="#C2B09A" stroke="#7A6A58" strokeWidth={0.6}/>
        <rect x={3} y={3} width={34} height={8} fill="#C2B09A" stroke="#7A6A58" strokeWidth={0.6}/>
        <polygon points="17,3 23,3 21,11 19,11" fill="#A89070"/>
        <rect x={10} y={11} width={20} height={26} fill="transparent"/>
      </svg>
    ),
    'elev-stair-front': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={32} width={32} height={5} fill="#B8B4B0" stroke="#7A7470" strokeWidth={0.8}/>
        <rect x={6} y={26} width={28} height={6} fill="#D0CCCC" stroke="#7A7470" strokeWidth={0.6}/>
        <rect x={9} y={20} width={22} height={6} fill="#D0CCCC" stroke="#7A7470" strokeWidth={0.6}/>
        <rect x={12} y={14} width={16} height={6} fill="#D0CCCC" stroke="#7A7470" strokeWidth={0.6}/>
        <rect x={15} y={8} width={10} height={6} fill="#D0CCCC" stroke="#7A7470" strokeWidth={0.6}/>
      </svg>
    ),
    'elev-louver-fins': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={4} width={36} height={32} fill="#A8A8A8" stroke="#444" strokeWidth={1}/>
        {[6,13,20,27,34].map(y=><rect key={y} x={2} y={y} width={36} height={5} fill="#5B8B6E"/>)}
      </svg>
    ),
    'elev-spire': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="20,4 26,34 14,34" fill="#B87333" stroke="#333" strokeWidth={1.2}/>
        <circle cx={20} cy={4} r={2.5} fill="#B87333" stroke="#333" strokeWidth={1.2}/>
      </svg>
    ),
    'elev-spandrel-panel': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={10} width={36} height={20} fill="#9CA3AF" stroke="#333" strokeWidth={1.2}/>
        {[8,16,24,32].map(x=>[12,18,24].map(y=><circle key={`${x}${y}`} cx={x} cy={y} r={1} fill="rgba(0,0,0,0.15)"/>))}
      </svg>
    ),
    'elev-floor-level-marker': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={2} y1={16} x2={38} y2={16} stroke="#111" strokeWidth={1.5}/>
        <line x1={2} y1={16} x2={2} y2={24} stroke="#111" strokeWidth={1.5}/>
        <text x={5} y={24} fontSize="7" fill="#111" fontFamily="sans-serif">FL 1</text>
      </svg>
    ),
    'elev-material-callout': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={7} cy={20} r={2} fill="#111"/>
        <polyline points="7,20 18,20 18,10" fill="none" stroke="#111" strokeWidth={1}/>
        <rect x={19} y={6} width={19} height={12} fill="white" stroke="#111" strokeWidth={0.8} rx="1"/>
        <text x={22} y={15} fontSize="5" fill="#111" fontFamily="sans-serif">MATL</text>
      </svg>
    ),
    'elev-angled-panel': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="12,4 40,4 28,36 0,36" fill="rgba(255,255,255,0.1)" stroke="#111" strokeWidth={1}/>
      </svg>
    ),
    'elev-bay-window': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        {/* Crown */}
        <rect x={2} y={3} width={36} height={4} fill="#B8B0A0" stroke="#333" strokeWidth={0.8}/>
        {/* Left return (parallelogram) */}
        <polygon points="2,7 11,7 11,35 2,35" fill="#9A6A44" stroke="#333" strokeWidth={0.8}/>
        <rect x={4} y={15} width={5} height={12} fill="rgba(176,210,228,0.5)" stroke="#3A4E60" strokeWidth={0.4}/>
        {/* Center face */}
        <rect x={11} y={7} width={18} height={28} fill="#C8966C" stroke="#333" strokeWidth={0.8}/>
        <rect x={14} y={13} width={12} height={16} fill="rgba(176,210,228,0.55)" stroke="#3A4E60" strokeWidth={0.5}/>
        <line x1={20} y1={13} x2={20} y2={29} stroke="#4A6070" strokeWidth={0.8}/>
        <rect x={14} y={20} width={12} height={1.5} fill="#4A6070"/>
        {/* Right return (parallelogram) */}
        <polygon points="29,7 38,7 38,35 29,35" fill="#9A6A44" stroke="#333" strokeWidth={0.8}/>
        <rect x={31} y={15} width={5} height={12} fill="rgba(176,210,228,0.5)" stroke="#3A4E60" strokeWidth={0.4}/>
        {/* Base */}
        <rect x={2} y={35} width={36} height={3} fill="#B8B0A0" stroke="#333" strokeWidth={0.8}/>
      </svg>
    ),
    // ── New annotation symbols ──
    'annotation-elevation-target': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={16} fill="white" stroke="#111" strokeWidth={1.2}/>
        <line x1={5} y1={20} x2={35} y2={20} stroke="#111" strokeWidth={0.8}/>
        <text x={20} y={17} textAnchor="middle" fontSize="7" fill="#111" fontFamily="sans-serif" fontWeight="bold">1</text>
        <text x={20} y={29} textAnchor="middle" fontSize="6" fill="#111" fontFamily="sans-serif">A-3</text>
        <polygon points="36,20 30,17 30,23" fill="#111"/>
      </svg>
    ),
    'annotation-room-tag': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={10} width={36} height={20} fill="white" stroke="#111" strokeWidth={1}/>
        <line x1={2} y1={21} x2={38} y2={21} stroke="#111" strokeWidth={0.6}/>
        <text x={20} y={19} textAnchor="middle" fontSize="6" fill="#111" fontFamily="sans-serif" fontWeight="bold">ROOM</text>
        <text x={20} y={28} textAnchor="middle" fontSize="6" fill="#111" fontFamily="sans-serif">101</text>
      </svg>
    ),
    'annotation-door-tag': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="20,4 33,12 33,28 20,36 7,28 7,12" fill="white" stroke="#111" strokeWidth={1.2}/>
        <text x={20} y={24} textAnchor="middle" fontSize="11" fill="#111" fontFamily="sans-serif" fontWeight="bold">1</text>
      </svg>
    ),
    'annotation-section-ref': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={16} fill="white" stroke="#111" strokeWidth={1.2}/>
        <line x1={5} y1={20} x2={35} y2={20} stroke="#111" strokeWidth={0.8}/>
        <text x={20} y={17} textAnchor="middle" fontSize="8" fill="#111" fontFamily="sans-serif" fontWeight="bold">A</text>
        <text x={20} y={29} textAnchor="middle" fontSize="6" fill="#111" fontFamily="sans-serif">A-2</text>
      </svg>
    ),
    'annotation-column-grid-h': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={2} y1={20} x2={28} y2={20} stroke="#555" strokeWidth={1} strokeDasharray="5 3"/>
        <circle cx={34} cy={20} r={6} fill="white" stroke="#111" strokeWidth={1.2}/>
        <text x={34} y={23} textAnchor="middle" fontSize="7" fill="#111" fontFamily="sans-serif">A</text>
      </svg>
    ),
    'annotation-drawing-title': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <text x={20} y={16} textAnchor="middle" fontSize="8" fill="#111" fontFamily="sans-serif" fontWeight="bold">TITLE</text>
        <line x1={2} y1={20} x2={38} y2={20} stroke="#111" strokeWidth={1.5}/>
        <line x1={2} y1={22} x2={38} y2={22} stroke="#111" strokeWidth={0.5}/>
        <text x={4} y={30} fontSize="6" fill="#111" fontFamily="sans-serif" fontWeight="bold">A-1</text>
        <text x={38} y={30} textAnchor="end" fontSize="5" fill="#111" fontFamily="sans-serif">1/4"=1'</text>
      </svg>
    ),
    'annotation-back-reference': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="4,20 12,10 38,10 38,30 12,30" fill="white" stroke="#111" strokeWidth={1.2}/>
        <line x1={12} y1={20} x2={38} y2={20} stroke="#111" strokeWidth={0.6}/>
        <text x={25} y={18} textAnchor="middle" fontSize="7" fill="#111" fontFamily="sans-serif" fontWeight="bold">1</text>
        <text x={25} y={27} textAnchor="middle" fontSize="6" fill="#111" fontFamily="sans-serif">A-2</text>
      </svg>
    ),
    'annotation-floor-elevation': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <text x={20} y={14} textAnchor="middle" fontSize="7" fill="#111" fontFamily="sans-serif">± 0'-0"</text>
        <line x1={6} y1={18} x2={34} y2={18} stroke="#111" strokeWidth={1}/>
        <polygon points="20,18 13,30 27,30" fill="#111"/>
      </svg>
    ),
    'annotation-work-point': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={14} fill="white" stroke="#111" strokeWidth={1.2}/>
        <line x1={7} y1={7} x2={33} y2={33} stroke="#111" strokeWidth={1.2}/>
        <line x1={33} y1={7} x2={7} y2={33} stroke="#111" strokeWidth={1.2}/>
      </svg>
    ),
    'annotation-revision-delta': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="20,5 37,35 3,35" fill="#111"/>
        <text x={20} y={31} textAnchor="middle" fontSize="10" fill="white" fontFamily="sans-serif" fontWeight="bold">1</text>
      </svg>
    ),
    // ── Detail cross-sections ──
    'detail-stud-2x6': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={14} y={5} width={12} height={30} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={14} y1={5} x2={26} y2={35} stroke="#8B7340" strokeWidth={0.8}/>
        <line x1={26} y1={5} x2={14} y2={35} stroke="#8B7340" strokeWidth={0.8}/>
      </svg>
    ),
    'detail-stud-2x8': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={13} y={3} width={14} height={34} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={13} y1={3} x2={27} y2={37} stroke="#8B7340" strokeWidth={0.8}/>
        <line x1={27} y1={3} x2={13} y2={37} stroke="#8B7340" strokeWidth={0.8}/>
      </svg>
    ),
    'detail-stud-2x10': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={12} y={2} width={16} height={36} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={12} y1={2} x2={28} y2={38} stroke="#8B7340" strokeWidth={0.8}/>
        <line x1={28} y1={2} x2={12} y2={38} stroke="#8B7340" strokeWidth={0.8}/>
      </svg>
    ),
    'detail-stud-2x12': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={11} y={2} width={18} height={36} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={11} y1={2} x2={29} y2={38} stroke="#8B7340" strokeWidth={0.8}/>
        <line x1={29} y1={2} x2={11} y2={38} stroke="#8B7340" strokeWidth={0.8}/>
      </svg>
    ),
    'detail-post-4x4': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={8} y={8} width={24} height={24} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={8} y1={8} x2={32} y2={32} stroke="#8B7340" strokeWidth={0.8}/>
        <line x1={32} y1={8} x2={8} y2={32} stroke="#8B7340" strokeWidth={0.8}/>
      </svg>
    ),
    // ── Detail face views ──
    'detail-stud-2x4-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={16} width={34} height={8} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={5} y1={19} x2={35} y2={19} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={5} y1={22} x2={35} y2={22} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
      </svg>
    ),
    // ── Edge views (1.5" narrow face, all 2× sizes) ──
    'detail-stud-2x4-edge': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={17} y={3} width={6} height={34} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={19.5} y1={5} x2={19.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={21.5} y1={5} x2={21.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
      </svg>
    ),
    'detail-stud-2x6-edge': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={17} y={3} width={6} height={34} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={19.5} y1={5} x2={19.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={21.5} y1={5} x2={21.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <text x={20} y={38} textAnchor="middle" fontSize="5" fill="#888" fontFamily="sans-serif">2×6</text>
      </svg>
    ),
    'detail-stud-2x8-edge': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={17} y={3} width={6} height={34} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={19.5} y1={5} x2={19.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={21.5} y1={5} x2={21.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <text x={20} y={38} textAnchor="middle" fontSize="5" fill="#888" fontFamily="sans-serif">2×8</text>
      </svg>
    ),
    'detail-stud-2x10-edge': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={17} y={3} width={6} height={34} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={19.5} y1={5} x2={19.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={21.5} y1={5} x2={21.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <text x={20} y={38} textAnchor="middle" fontSize="5" fill="#888" fontFamily="sans-serif">2×10</text>
      </svg>
    ),
    'detail-stud-2x12-edge': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={17} y={3} width={6} height={34} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={19.5} y1={5} x2={19.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={21.5} y1={5} x2={21.5} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <text x={20} y={38} textAnchor="middle" fontSize="5" fill="#888" fontFamily="sans-serif">2×12</text>
      </svg>
    ),
    'detail-stud-2x6-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={14} y={3} width={12} height={34} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={18} y1={5} x2={18} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={22} y1={5} x2={22} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
      </svg>
    ),
    'detail-stud-2x8-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={13} width={34} height={14} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={5} y1={17} x2={35} y2={17} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={5} y1={21} x2={35} y2={21} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
      </svg>
    ),
    'detail-stud-2x10-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={11} width={34} height={18} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={5} y1={16} x2={35} y2={16} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={5} y1={20} x2={35} y2={20} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={5} y1={24} x2={35} y2={24} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
      </svg>
    ),
    'detail-stud-2x12-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={3} y={9} width={34} height={22} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={5} y1={15} x2={35} y2={15} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={5} y1={20} x2={35} y2={20} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={5} y1={25} x2={35} y2={25} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
      </svg>
    ),
    'detail-post-4x4-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={13} y={3} width={14} height={34} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={17} y1={5} x2={17} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
        <line x1={21} y1={5} x2={21} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
      </svg>
    ),
    'detail-1x-face': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={17} y={3} width={6} height={34} fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={20} y1={5} x2={20} y2={35} stroke="#8B7340" strokeWidth={0.5} opacity={0.6}/>
      </svg>
    ),
    // ── Pitched rafter blox ──
    'detail-rafter': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="2,32 38,8 38,26 2,38" fill="#EDE5C8" stroke="#111" strokeWidth={1.2}/>
        <line x1={2} y1={35} x2={38} y2={14} stroke="#8B7340" strokeWidth={0.6} opacity={0.5}/>
        <line x1={2} y1={36.5} x2={38} y2={20} stroke="#8B7340" strokeWidth={0.6} opacity={0.5}/>
      </svg>
    ),
    'detail-pitched-layer': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="2,26 38,10 38,16 2,28" fill="#EDE0C0" stroke="#111" strokeWidth={1.2}/>
        <line x1={2} y1={27} x2={38} y2={13} stroke="#7A6330" strokeWidth={0.5} opacity={0.65}/>
      </svg>
    ),
    // ── Eave / roofing extras ──
    'detail-felt': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={18} width={36} height={4} fill="#3A3A3A" stroke="#222" strokeWidth={1}/>
        <line x1={2} y1={19.5} x2={38} y2={19.5} stroke="rgba(255,255,255,0.2)" strokeWidth={0.8}/>
      </svg>
    ),
    'detail-gutter': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <path d="M6,10 L6,30 Q6,38 14,38 L26,38 Q34,38 34,30 L34,14 L28,10 Z" fill="#C0C0C0" stroke="#444" strokeWidth={1}/>
        <line x1={20} y1={10} x2={20} y2={4} stroke="#888" strokeWidth={1}/>
      </svg>
    ),
    'detail-brick-veneer': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={8} y={4} width={24} height={32} fill="#C47B5A" stroke="#111" strokeWidth={1}/>
        {[10,16,22,28].map(y=>(
          <g key={y}>
            <line x1={8} y1={y} x2={32} y2={y} stroke="#7A4A2A" strokeWidth={0.5} opacity={0.6}/>
            <line x1={y%12===10?16:8} y1={y} x2={y%12===10?16:8} y2={Math.min(y+6,36)} stroke="#7A4A2A" strokeWidth={0.5} opacity={0.6}/>
          </g>
        ))}
      </svg>
    ),
    // ── Soffit detail elements ──
    'detail-plywood': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="#EDE0C0" stroke="#111" strokeWidth={1.2}/>
        <line x1={2} y1={18.7} x2={38} y2={18.7} stroke="#7A6330" strokeWidth={0.5} opacity={0.7}/>
        <line x1={2} y1={21.3} x2={38} y2={21.3} stroke="#7A6330" strokeWidth={0.5} opacity={0.7}/>
      </svg>
    ),
    'detail-rigid-insulation': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={13} width={36} height={14} fill="#DCF0FF" stroke="#5AAAD0" strokeWidth={1.2}/>
        {[8,16,24,32].map(x=>[17,21,25].map(y=>(
          <g key={`${x}${y}`}>
            <line x1={x-2} y1={y-2} x2={x+2} y2={y+2} stroke="#2A7EA8" strokeWidth={0.5} opacity={0.5}/>
            <line x1={x+2} y1={y-2} x2={x-2} y2={y+2} stroke="#2A7EA8" strokeWidth={0.5} opacity={0.5}/>
          </g>
        )))}
      </svg>
    ),
    'detail-vent-baffle': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="rgba(200,230,255,0.2)" stroke="#7AAFD4" strokeWidth={1} strokeDasharray="4 3"/>
        <line x1={4} y1={20} x2={36} y2={20} stroke="#7AAFD4" strokeWidth={0.5} strokeDasharray="6 4"/>
      </svg>
    ),
    'detail-soffit-panel': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={17} width={36} height={6} fill="#E8E4DC" stroke="#111" strokeWidth={1.2}/>
        {[9,17,25,33].map(x=>(
          <g key={x}>
            <line x1={x-1} y1={18.5} x2={x-1} y2={21.5} stroke="#888" strokeWidth={0.8}/>
            <line x1={x+1} y1={18.5} x2={x+1} y2={21.5} stroke="#888" strokeWidth={0.8}/>
          </g>
        ))}
      </svg>
    ),
    'detail-shingles': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={4} width={36} height={32} fill="#3A3A3A" stroke="#111" strokeWidth={1.2}/>
        {[36,28,20,12,4].map((y,ci)=>(
          <g key={y}>
            <line x1={2} y1={y} x2={38} y2={y} stroke="#222" strokeWidth={0.7}/>
            {[2+ci%2*5,13+ci%2*5,24+ci%2*5,35+ci%2*5].map(x=>(
              <line key={x} x1={x} y1={y} x2={x} y2={Math.max(4,y-4)} stroke="#222" strokeWidth={0.5}/>
            ))}
          </g>
        ))}
      </svg>
    ),
    'detail-flashing': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={18} width={36} height={4} fill="#A8A8A8" stroke="#555" strokeWidth={1}/>
        <line x1={2} y1={19.2} x2={38} y2={19.2} stroke="rgba(255,255,255,0.4)" strokeWidth={1}/>
      </svg>
    ),
    // ── Fire-rated walls ──
    'wall-fire-1hr': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="#6A4A4A" stroke="#111" strokeWidth={0.8}/>
        {[-4,4,12,20,28].map(x=><line key={x} x1={x} y1={16} x2={x+8} y2={24} stroke="#C45050" strokeWidth={0.7}/>)}
        <text x={20} y={23} textAnchor="middle" fontSize="6" fill="#FFDDDD" fontFamily="sans-serif" fontWeight="bold">1HR</text>
      </svg>
    ),
    'wall-fire-2hr': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={16} width={36} height={8} fill="#5A2A2A" stroke="#111" strokeWidth={0.8}/>
        {[-4,4,12,20,28].map(x=><line key={x} x1={x} y1={16} x2={x+8} y2={24} stroke="#DD3333" strokeWidth={0.7}/>)}
        {[-4,4,12,20,28].map(x=><line key={`r${x}`} x1={x+8} y1={16} x2={x} y2={24} stroke="#DD3333" strokeWidth={0.7}/>)}
        <text x={20} y={23} textAnchor="middle" fontSize="6" fill="#FFCCCC" fontFamily="sans-serif" fontWeight="bold">2HR</text>
      </svg>
    ),
    // ── New fixtures ──
    'fixture-shower': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="white" stroke="#555" strokeWidth={1.2}/>
        <line x1={2} y1={8} x2={38} y2={8} stroke="#888" strokeWidth={0.7} strokeDasharray="4 2"/>
        <circle cx={20} cy={26} r={5} fill="#eee" stroke="#888" strokeWidth={0.8}/>
        <circle cx={20} cy={26} r={2} fill="#ddd" stroke="#aaa" strokeWidth={0.5}/>
        <circle cx={9} cy={10} r={3} fill="none" stroke="#aaa" strokeWidth={0.7}/>
      </svg>
    ),
    'fixture-washer': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="white" stroke="#555" strokeWidth={1.2} rx={2}/>
        <circle cx={20} cy={22} r={11} fill="#f5f5f5" stroke="#888" strokeWidth={0.9}/>
        <circle cx={20} cy={22} r={5} fill="white" stroke="#bbb" strokeWidth={0.6}/>
        <text x={20} y={10} textAnchor="middle" fontSize="6" fill="#888" fontFamily="sans-serif">W</text>
      </svg>
    ),
    'fixture-dryer': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="white" stroke="#555" strokeWidth={1.2} rx={2}/>
        <circle cx={20} cy={22} r={11} fill="#f5f5f5" stroke="#888" strokeWidth={0.9}/>
        <circle cx={20} cy={22} r={5} fill="white" stroke="#bbb" strokeWidth={0.6}/>
        <text x={20} y={10} textAnchor="middle" fontSize="6" fill="#888" fontFamily="sans-serif">D</text>
      </svg>
    ),
    'fixture-water-heater': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={17} fill="white" stroke="#555" strokeWidth={1.2}/>
        <circle cx={20} cy={20} r={10} fill="#f5f5f5" stroke="#bbb" strokeWidth={0.6}/>
        <text x={20} y={23} textAnchor="middle" fontSize="7" fill="#888" fontFamily="sans-serif">WH</text>
      </svg>
    ),
    'fixture-utility-sink': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="white" stroke="#555" strokeWidth={1.2}/>
        <rect x={5} y={5} width={30} height={30} rx={3} fill="#f5f5f5" stroke="#888" strokeWidth={0.6}/>
        <circle cx={20} cy={20} r={3} fill="#aaa" stroke="#555" strokeWidth={0.5}/>
      </svg>
    ),
    // ── New openings ──
    'door-pocket': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={2} y1={2} x2={2} y2={38} stroke="#555" strokeWidth={1.5}/>
        <line x1={38} y1={2} x2={38} y2={38} stroke="#555" strokeWidth={1.5}/>
        <rect x={4} y={4} width={16} height={32} fill="rgba(135,206,250,0.15)" stroke="#777" strokeWidth={0.6} strokeDasharray="4 2"/>
        <line x1={12} y1={8} x2={12} y2={33} stroke="#555" strokeWidth={0.8}/>
        <line x1={8} y1={29} x2={12} y2={33} stroke="#555" strokeWidth={0.8}/>
        <line x1={16} y1={29} x2={12} y2={33} stroke="#555" strokeWidth={0.8}/>
      </svg>
    ),
    'door-bifold': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={2} y1={2} x2={2} y2={38} stroke="#555" strokeWidth={1.5}/>
        <line x1={38} y1={2} x2={38} y2={38} stroke="#555" strokeWidth={1.5}/>
        <polygon points="2,2 14,22 2,38" fill="rgba(135,206,250,0.12)" stroke="#555" strokeWidth={0.8}/>
        <polygon points="38,2 26,22 38,38" fill="rgba(135,206,250,0.12)" stroke="#555" strokeWidth={0.8}/>
      </svg>
    ),
    'door-garage': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <line x1={2} y1={2} x2={2} y2={38} stroke="#555" strokeWidth={1.5}/>
        <line x1={38} y1={2} x2={38} y2={38} stroke="#555" strokeWidth={1.5}/>
        <rect x={2} y={38} width={36} height={14} fill="rgba(200,200,200,0.1)" stroke="#888" strokeWidth={0.6} strokeDasharray="4 2"/>
        <line x1={2} y1={43} x2={38} y2={43} stroke="#aaa" strokeWidth={0.5} strokeDasharray="3 2"/>
        <line x1={2} y1={48} x2={38} y2={48} stroke="#aaa" strokeWidth={0.5} strokeDasharray="3 2"/>
      </svg>
    ),
    // ── New furniture ──
    'furniture-nightstand': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={4} y={4} width={32} height={32} fill="#f5f0e8" stroke="#555" strokeWidth={1.2} rx={2}/>
        <rect x={8} y={8} width={24} height={24} fill="none" stroke="#ccc" strokeWidth={0.6}/>
        <circle cx={20} cy={20} r={3} fill="#ddd" stroke="#aaa" strokeWidth={0.6}/>
      </svg>
    ),
    'furniture-bookcase': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="#f5f0e8" stroke="#555" strokeWidth={1.2}/>
        <line x1={2} y1={14} x2={38} y2={14} stroke="#bbb" strokeWidth={0.7}/>
        <line x1={2} y1={26} x2={38} y2={26} stroke="#bbb" strokeWidth={0.7}/>
      </svg>
    ),
    'furniture-tv-unit': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="#f0ece4" stroke="#555" strokeWidth={1.2}/>
        <rect x={4} y={3} width={32} height={18} fill="#1a1a2e" stroke="#333" strokeWidth={0.5} rx={1}/>
        <line x1={2} y1={26} x2={38} y2={26} stroke="#ccc" strokeWidth={0.5}/>
      </svg>
    ),
    // ── New casework ──
    'casework-pantry': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="white" stroke="#555" strokeWidth={1.2}/>
        <line x1={2} y1={34} x2={38} y2={34} stroke="#555" strokeWidth={0.9}/>
        <line x1={2} y1={14} x2={38} y2={14} stroke="#bbb" strokeWidth={0.5}/>
        <line x1={2} y1={24} x2={38} y2={24} stroke="#bbb" strokeWidth={0.5}/>
      </svg>
    ),
    'casework-closet-rod': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="rgba(245,240,232,0.5)" stroke="#555" strokeWidth={1}/>
        <rect x={2} y={2} width={36} height={12} fill="#e8e4dc" stroke="#aaa" strokeWidth={0.5}/>
        <line x1={5} y1={26} x2={35} y2={26} stroke="#888" strokeWidth={2} strokeLinecap="round"/>
        <circle cx={10} cy={26} r={2} fill="#999" stroke="#666" strokeWidth={0.5}/>
        <circle cx={30} cy={26} r={2} fill="#999" stroke="#666" strokeWidth={0.5}/>
      </svg>
    ),
    // ── New structural ──
    'structural-beam': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={10} width={36} height={20} fill="#d8d8d8" stroke="#555" strokeWidth={1.2}/>
        {[-10,0,10,20,30,40].map(x=><line key={x} x1={x} y1={10} x2={x+20} y2={30} stroke="#bbb" strokeWidth={0.5}/>)}
        <line x1={2} y1={14} x2={38} y2={14} stroke="#555" strokeWidth={0.6}/>
        <line x1={2} y1={26} x2={38} y2={26} stroke="#555" strokeWidth={0.6}/>
      </svg>
    ),
    'structural-footing': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="#c8c8c8" stroke="#555" strokeWidth={1.2}/>
        {[-10,0,10,20,30,40].map(x=><line key={x} x1={x} y1={2} x2={x+38} y2={40} stroke="#999" strokeWidth={0.5}/>)}
        {[-10,0,10,20,30,40].map(x=><line key={`r${x}`} x1={x+38} y1={2} x2={x} y2={40} stroke="#999" strokeWidth={0.5}/>)}
        <rect x={2} y={2} width={36} height={36} fill="transparent" stroke="#555" strokeWidth={1.2}/>
      </svg>
    ),
    // ── New elevation ──
    'elev-railing': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={4} width={36} height={5} fill="#888" stroke="#555" strokeWidth={0.8}/>
        {[2,10,18,26,34].map(x=><line key={x} x1={x+2} y1={9} x2={x+2} y2={38} stroke="#666" strokeWidth={0.5}/>)}
        <line x1={2} y1={38} x2={38} y2={38} stroke="#555" strokeWidth={0.6}/>
      </svg>
    ),
    'elev-siding': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={2} width={36} height={36} fill="#C8B090" stroke="#555" strokeWidth={0.8}/>
        {[8,14,20,26,32].map(y=>(
          <React.Fragment key={y}>
            <line x1={2} y1={y} x2={38} y2={y} stroke="rgba(0,0,0,0.28)" strokeWidth={0.8}/>
            <line x1={2} y1={y+1} x2={38} y2={y+1} stroke="rgba(0,0,0,0.07)" strokeWidth={1.5}/>
          </React.Fragment>
        ))}
      </svg>
    ),
    // ── New details ──
    'detail-lvl-beam': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={8} width={36} height={24} fill="#EDE5C8" stroke="#555" strokeWidth={1.2}/>
        {[10,18,26].map(x=><line key={x} x1={x} y1={9} x2={x} y2={31} stroke="#8B7340" strokeWidth={0.5} opacity={0.7}/>)}
      </svg>
    ),
    'detail-tji-joist': (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x={2} y={4} width={36} height={7} fill="#EDE5C8" stroke="#555" strokeWidth={1}/>
        <rect x={2} y={29} width={36} height={7} fill="#EDE5C8" stroke="#555" strokeWidth={1}/>
        <rect x={16} y={11} width={8} height={18} fill="#D4C4A0" stroke="#555" strokeWidth={0.5}/>
        <line x1={17} y1={16} x2={23} y2={16} stroke="#AA9070" strokeWidth={0.4} opacity={0.6}/>
        <line x1={17} y1={22} x2={23} y2={22} stroke="#AA9070" strokeWidth={0.4} opacity={0.6}/>
      </svg>
    ),
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
