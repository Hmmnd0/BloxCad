import React from 'react'

/** CAD-specific affordances; these are UI icons, not drawing symbols. */
export function CadToolIcon({ kind }: { kind: 'wall' | 'conduit' | 'circuit' | 'dimension' }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'wall' && <><path d="M4 20V4h16v5H9v11Z" /><path d="m4 9 5-5m-5 11 5-5m0-1 5-5m1 5 5-5" opacity=".4" /></>}
    {kind === 'conduit' && <><path d="M4 20v-7a7 7 0 0 1 7-7h9M8 20v-7a3 3 0 0 1 3-3h9" /><path d="M2 18h8M18 4v8" /></>}
    {kind === 'circuit' && <><circle cx="4" cy="17" r="2" /><circle cx="20" cy="7" r="2" /><path d="M6 17h3c5 0 1-10 6-10h3M10 14l4-4m-4 1 4 2" /></>}
    {kind === 'dimension' && <><path d="M5 5v14M19 5v14M3 12h18M3 14l4-4m10 4 4-4" /><path d="M9 7h6" opacity=".45" /></>}
  </svg>
}
