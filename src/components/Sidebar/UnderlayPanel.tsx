import React, { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Underlay } from '../../types'

export function UnderlayPanel() {
  const {
    project,
    underlayCalibrationMode,
    underlayCalibrationPoints,
    setUnderlay, clearUnderlay,
    setUnderlayOpacity, setUnderlayVisible, setUnderlayCalibration, setUnderlayDescription,
    startUnderlayCalibration, cancelUnderlayCalibration
  } = useStore()

  const underlay = project?.underlay
  const fileRef = useRef<HTMLInputElement>(null)
  const [simpleWidth, setSimpleWidth] = useState('')
  const [twoPointDist, setTwoPointDist] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new window.Image()
      img.onload = () => {
        const u: Underlay = {
          imageData: dataUrl,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          opacity: 0.5,
          visible: true,
          calibration: null
        }
        setUnderlay(u)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function applySimpleCalibration() {
    const w = parseFloat(simpleWidth)
    if (!w || w <= 0) return
    setUnderlayCalibration({ method: 'simple', realWidthFt: w })
    setSimpleWidth('')
  }

  function applyTwoPointCalibration() {
    if (underlayCalibrationPoints.length < 2) return
    const d = parseFloat(twoPointDist)
    if (!d || d <= 0) return
    const [p1, p2] = underlayCalibrationPoints
    setUnderlayCalibration({
      method: 'two-point',
      p1px: p1,
      p2px: p2,
      realDistFt: d
    })
    cancelUnderlayCalibration()
    setTwoPointDist('')
  }

  return (
    <div className="flex-1 overflow-y-auto py-2 px-3 space-y-4 text-xs text-gray-300">
      {/* Import */}
      <div>
        <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Reference Image</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-1.5 px-3 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs transition-colors"
        >
          {underlay ? 'Replace Image' : 'Import Image...'}
        </button>
        {underlay && (
          <button
            onClick={clearUnderlay}
            className="w-full mt-1 py-1.5 px-3 rounded bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-300 text-xs transition-colors"
          >
            Remove Underlay
          </button>
        )}
      </div>

      {underlay && (
        <>
          {/* Visibility & Opacity */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Display</p>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={underlay.visible}
                onChange={e => setUnderlayVisible(e.target.checked)}
                className="accent-blue-500"
              />
              <span>Visible</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-14">Opacity</span>
              <input
                type="range"
                min={0.05} max={1} step={0.05}
                value={underlay.opacity}
                onChange={e => setUnderlayOpacity(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-gray-400 w-7 text-right">{Math.round(underlay.opacity * 100)}%</span>
            </div>
          </div>

          {/* Calibration */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Calibration</p>

            {underlay.calibration && (
              <div className="mb-2 text-[10px] text-green-400 bg-green-950 rounded px-2 py-1">
                {underlay.calibration.method === 'simple'
                  ? `Simple: ${underlay.calibration.realWidthFt}' wide`
                  : `Two-point: ${underlay.calibration.realDistFt}' span`}
                <button
                  onClick={() => setUnderlayCalibration(null)}
                  className="ml-2 text-gray-500 hover:text-red-400"
                >✕</button>
              </div>
            )}

            {/* Simple calibration */}
            <p className="text-gray-500 mb-1">Simple — enter real image width (ft):</p>
            <div className="flex gap-1 mb-3">
              <input
                type="number"
                min={1}
                placeholder="e.g. 50"
                value={simpleWidth}
                onChange={e => setSimpleWidth(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:border-accent focus:outline-none"
              />
              <button
                onClick={applySimpleCalibration}
                className="px-2 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs transition-colors"
              >Set</button>
            </div>

            {/* Two-point calibration */}
            <p className="text-gray-500 mb-1">Two-point — click two known points on image:</p>
            {underlayCalibrationMode === 'none' ? (
              <button
                onClick={startUnderlayCalibration}
                className="w-full py-1.5 px-3 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs transition-colors"
              >
                Pick Points on Canvas
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] text-blue-300 bg-blue-950 rounded px-2 py-1">
                  {underlayCalibrationPoints.length === 0
                    ? 'Click point 1 on the canvas'
                    : underlayCalibrationPoints.length === 1
                    ? 'Click point 2 on the canvas'
                    : 'Both points picked — enter distance below'}
                </div>
                {underlayCalibrationPoints.length >= 2 && (
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={0.1}
                      placeholder="Real dist (ft)"
                      value={twoPointDist}
                      onChange={e => setTwoPointDist(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:border-accent focus:outline-none"
                    />
                    <button
                      onClick={applyTwoPointCalibration}
                      className="px-2 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs transition-colors"
                    >Apply</button>
                  </div>
                )}
                <button
                  onClick={cancelUnderlayCalibration}
                  className="w-full py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition-colors"
                >Cancel</button>
              </div>
            )}
          </div>

          {/* AI Description */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">AI Description</p>
            <p className="text-gray-600 text-[10px] mb-1">
              Describe the drawing so Claude can distinguish underlay lines from placed blox (e.g. "HABS floor plan — double-line walls, travertine floor hatch").
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Farnsworth House HABS — thick double walls, travertine tile hatch on floors, exterior terrace shown as grid"
              value={underlay.description ?? ''}
              onChange={e => setUnderlayDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:border-accent focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Image info */}
          <div className="text-[10px] text-gray-600 border-t border-gray-700 pt-2">
            {underlay.naturalWidth} × {underlay.naturalHeight} px
          </div>
        </>
      )}

      {!underlay && (
        <p className="text-gray-600 text-[10px] text-center pt-4">
          Import a floor plan, HABS drawing, or site photo to use as a tracing reference.
        </p>
      )}
    </div>
  )
}
