import React from 'react'
import { useStore } from '../../store/useStore'
import { SCALES } from '../../types'

const CELL = 'border border-gray-400 px-2 py-0.5'
const LABEL = 'text-[9px] text-gray-400 uppercase tracking-wider leading-none mb-0.5'
const VALUE = 'text-xs text-gray-900 leading-tight'

function Field({ label, value, onChange, wide }: {
  label: string; value: string; onChange: (v: string) => void; wide?: boolean
}) {
  return (
    <div className={`${CELL} flex flex-col justify-center min-w-0 ${wide ? 'flex-1' : 'w-36'}`}>
      <div className={LABEL}>{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${VALUE} bg-transparent border-none outline-none w-full`}
      />
    </div>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${CELL} flex flex-col justify-center w-36`}>
      <div className={LABEL}>{label}</div>
      <div className={VALUE}>{value}</div>
    </div>
  )
}

export function TitleBlock() {
  const { project, updateTitleBlock } = useStore()
  if (!project) return null

  const tb = project.titleBlock ?? {
    address: '', drawingTitle: 'Floor Plan', drawnBy: '', checkedBy: '',
    projectDate: new Date().toLocaleDateString(), sheetNumber: 'A1.1', jobNumber: ''
  }

  const upd = (k: keyof typeof tb) => (v: string) => updateTitleBlock({ [k]: v })

  return (
    <div
      className="shrink-0 border-t-2 border-gray-700 bg-white no-print"
      style={{ fontFamily: 'inherit' }}
    >
      <div className="flex h-16 border border-gray-400">
        {/* Project name — widest column */}
        <div className={`${CELL} flex flex-col justify-center flex-[2]`}>
          <div className={LABEL}>Project Name</div>
          <div className="text-sm font-bold text-gray-900 leading-tight truncate">{project.name}</div>
        </div>

        <Field label="Address" value={tb.address} onChange={upd('address')} wide />
        <Field label="Drawing Title" value={tb.drawingTitle} onChange={upd('drawingTitle')} />

        {/* Right column — metadata stack */}
        <div className="flex flex-col border-l border-gray-400">
          <div className="flex">
            <Field label="Drawn By" value={tb.drawnBy} onChange={upd('drawnBy')} />
            <Field label="Checked By" value={tb.checkedBy} onChange={upd('checkedBy')} />
          </div>
          <div className="flex border-t border-gray-400">
            <Field label="Date" value={tb.projectDate} onChange={upd('projectDate')} />
            <Field label="Sheet No." value={tb.sheetNumber} onChange={upd('sheetNumber')} />
            <Field label="Job No." value={tb.jobNumber} onChange={upd('jobNumber')} />
            <ReadOnly label="Scale" value={SCALES[project.scale].label} />
          </div>
        </div>
      </div>
    </div>
  )
}
