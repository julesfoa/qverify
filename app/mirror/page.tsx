'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { ProgressStepper } from '@/components/ProgressStepper'

function tokenize(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
}

type Mode = 'stream' | 'paste'

export default function MirrorPage() {
  const router = useRouter()
  const { name, entityType, useMock, setRawText, setSentences, setStreamingDone, streamingDone, rawText } =
    useStore()

  const [mode, setMode] = useState<Mode>('stream')
  const [pasteText, setPasteText] = useState('')
  const [streamText, setStreamText] = useState(rawText || '')
  const [streaming, setStreaming] = useState(false)
  const [done, setDone] = useState(streamingDone)
  const abortRef = useRef<AbortController | null>(null)

  // Start stream on mount in stream mode if not already done
  useEffect(() => {
    if (mode !== 'stream') return

    if (streamingDone && rawText) {
      setStreamText(rawText)
      setDone(true)
      return
    }

    const ctrl = new AbortController()
    abortRef.current = ctrl
    setStreaming(true)
    setDone(false)

    const params = new URLSearchParams({ name, type: entityType })
    if (useMock) params.set('mock', 'true')

    async function fetchStream() {
      try {
        const res = await fetch(`/api/mirror?${params}`, { signal: ctrl.signal })
        if (!res.body) return
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let full = ''
        while (true) {
          const { done: rdone, value } = await reader.read()
          if (rdone) break
          full += decoder.decode(value, { stream: true })
          setStreamText(full)
        }
        const sentences = tokenize(full)
        setRawText(full)
        setSentences(sentences)
        setStreamingDone(true)
        setDone(true)
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') console.error(e)
      } finally {
        setStreaming(false)
      }
    }

    fetchStream()
    return () => ctrl.abort()
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSwitchMode(m: Mode) {
    abortRef.current?.abort()
    setMode(m)
    if (m === 'stream') {
      setStreamText('')
      setDone(false)
      setStreamingDone(false)
      setRawText('')
    }
  }

  function handleUsePasted() {
    if (!pasteText.trim()) return
    const sentences = tokenize(pasteText.trim())
    setRawText(pasteText.trim())
    setSentences(sentences)
    setStreamingDone(true)
    router.push('/annotate')
  }

  const entityLabel = entityType === 'brand' ? 'brand' : 'person'

  return (
    <main className="page">
      <div className="content space-y-5">

        <ProgressStepper />

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => router.push('/verify')}
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-gray-600"
          >
            ←
          </button>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Mirror
          </span>
        </div>

        {/* Title */}
        <div>
          <p className="text-xs text-gray-400 mb-1">
            AI&apos;s view of this {entityLabel}
          </p>
          <h2 className="text-xl font-bold text-gray-900">{name}</h2>
        </div>

        {/* Mode tabs */}
        <div className="card p-1.5">
          <div className="grid grid-cols-2 gap-1">
            {(['stream', 'paste'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleSwitchMode(m)}
                className={`py-2 rounded-xl text-sm font-semibold transition-all
                  ${mode === m ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {m === 'stream' ? '⚡ Live stream' : '📋 Paste bio'}
              </button>
            ))}
          </div>
        </div>

        {/* Stream mode */}
        {mode === 'stream' && (
          <>
            {streaming && (
              <div className="flex items-center gap-2 px-1">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">Querying Claude…</span>
              </div>
            )}

            <div className="card min-h-[160px]">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {streamText}
                {streaming && (
                  <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
                )}
              </p>
              {!streamText && !streaming && (
                <p className="text-sm text-gray-300 italic">Bio will appear here…</p>
              )}
            </div>

            {streamText && !streaming && (
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <span className="text-xs text-gray-400">
                  Generated by Claude · {streamText.split(' ').length} words
                </span>
              </div>
            )}

            {done && (
              <div className="card bg-accent-light border border-accent/20">
                <p className="text-sm font-semibold text-accent">✓ Stream complete</p>
                <p className="text-xs text-accent/70 mt-0.5">Tap sentences to mark false claims.</p>
              </div>
            )}

            <button
              onClick={() => router.push('/annotate')}
              disabled={!done}
              className="btn-primary"
            >
              Annotate false claims →
            </button>
          </>
        )}

        {/* Paste mode */}
        {mode === 'paste' && (
          <>
            <div className="card bg-gray-50 border border-dashed border-gray-300 p-1">
              <p className="text-xs text-gray-400 text-center py-1 mb-2">
                Paste AI output from ChatGPT, Perplexity, Google, or any AI tool
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Paste what an AI says about ${name || 'this ' + entityLabel}…`}
                rows={10}
                className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:border-accent resize-none placeholder-gray-300"
              />
            </div>

            {pasteText.trim().length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <span className="text-xs text-gray-400">
                  {tokenize(pasteText).length} sentences detected
                </span>
              </div>
            )}

            <button
              onClick={handleUsePasted}
              disabled={!pasteText.trim()}
              className="btn-primary"
            >
              Annotate false claims →
            </button>
          </>
        )}
      </div>
    </main>
  )
}
