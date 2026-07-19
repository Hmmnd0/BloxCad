import React, { useState } from 'react'

interface Props {
  onDismiss: () => void
}

export function ClaudeSetupDialog({ onDismiss }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleConnect = async () => {
    setStatus('connecting')
    const result = await window.api?.configureClaude?.()
    if (result?.success) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMsg(result?.error ?? 'Unknown error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-[480px] p-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-xl">✦</div>
            <h2 className="text-white text-lg font-semibold">Connect Claude to bloxCAD</h2>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            bloxCAD works with Claude Desktop so you can design floor plans and elevations using natural language — just describe what you want and Claude places it on the canvas.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3 bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-start gap-3 text-sm text-gray-300">
            <span className="w-5 h-5 rounded-full bg-orange-500/30 text-orange-400 text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>Click <strong className="text-white">Connect Now</strong> — bloxCAD writes the MCP config to Claude Desktop automatically.</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-300">
            <span className="w-5 h-5 rounded-full bg-orange-500/30 text-orange-400 text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span>Restart Claude Desktop for the connection to activate.</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-300">
            <span className="w-5 h-5 rounded-full bg-orange-500/30 text-orange-400 text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>Open a new Claude conversation and ask it to design something.</span>
          </div>
        </div>

        {/* Success state */}
        {status === 'success' && (
          <div className="flex items-center gap-3 bg-green-900/30 border border-green-700/50 rounded-lg px-4 py-3 text-sm text-green-300">
            <span className="text-green-400 text-base">✓</span>
            Config saved. Restart Claude Desktop and you're ready to go.
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="flex flex-col gap-1 bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-sm text-red-300">
            <span className="font-medium text-red-200">Setup failed</span>
            <span className="text-xs text-red-400 whitespace-pre-wrap">{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onDismiss}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {status === 'success' ? 'Done' : 'Skip for now'}
          </button>

          {status !== 'success' && (
            <button
              onClick={handleConnect}
              disabled={status === 'connecting'}
              className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/40 text-white text-sm font-medium transition-colors"
            >
              {status === 'connecting' ? 'Connecting…' : 'Connect Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
