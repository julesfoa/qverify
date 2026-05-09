'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useStore, type Annotation, type Verdict } from '@/lib/store'
import { buildCorrectionTx } from '@/lib/solana'
import { DEMO_ANNOTATIONS } from '@/lib/demo'
import { ProgressStepper } from '@/components/ProgressStepper'

const VERDICT_CONFIG: Record<Verdict, { label: string; bg: string; bar: string; badge: string }> = {
  true: {
    label: '✓ Correct',
    bg: 'bg-correct-bg border-correct/30',
    bar: 'border-l-correct',
    badge: 'bg-correct/10 text-correct',
  },
  false: {
    label: '✗ Faux',
    bg: 'bg-wrong-bg border-wrong/30',
    bar: 'border-l-wrong',
    badge: 'bg-wrong/10 text-wrong',
  },
  note: {
    label: '📝 Note',
    bg: 'bg-note-bg border-note/30',
    bar: 'border-l-note',
    badge: 'bg-note/10 text-note',
  },
}

export default function AnnotatePage() {
  const router = useRouter()
  const { publicKey, sendTransaction } = useWallet()
  const { setVisible: openWalletModal } = useWalletModal()
  const { useMock, sentences, annotations, setAnnotation, removeAnnotation, setSolanaSignature } =
    useStore()

  const [selected, setSelected] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partial<Annotation>>({})
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')

  // Demo mode: pre-populate the 3 known false sentences so the demo is bulletproof
  useEffect(() => {
    if (!useMock || sentences.length === 0) return
    if (Object.keys(annotations).length > 0) return // already annotated
    Object.entries(DEMO_ANNOTATIONS).forEach(([idx, ann]) => {
      setAnnotation(Number(idx), ann)
    })
  }, [useMock, sentences.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const falseCount = Object.values(annotations).filter(
    (a) => a.verdict === 'false' || a.verdict === 'note'
  ).length

  const handleSelect = useCallback(
    (i: number) => {
      setSelected(i)
      setDraft(annotations[i] || {})
    },
    [annotations]
  )

  const handleSave = useCallback(() => {
    if (selected === null || !draft.verdict) return
    setAnnotation(selected, { verdict: draft.verdict, correction: draft.correction })
    setSelected(null)
    setDraft({})
  }, [selected, draft, setAnnotation])

  const handleRemove = useCallback(() => {
    if (selected === null) return
    removeAnnotation(selected)
    setSelected(null)
    setDraft({})
  }, [selected, removeAnnotation])

  async function handleSign() {
    if (!publicKey || falseCount === 0) return
    setSigning(true)
    setSignError('')
    try {
      const corrections = Object.entries(annotations)
        .filter(([, a]) => a.verdict === 'false' || a.verdict === 'note')
        .map(([i, a]) => ({ sentence: sentences[Number(i)], correction: a.correction || '' }))
      const tx = await buildCorrectionTx(corrections, publicKey)
      const { connection } = await import('@/lib/solana')
      const sig = await sendTransaction(tx, connection)
      setSolanaSignature(sig)
      router.push('/investigate')
    } catch (e: unknown) {
      setSignError(e instanceof Error ? e.message : 'Transaction failed')
    } finally {
      setSigning(false)
    }
  }

  if (!sentences.length) {
    return (
      <main className="page justify-center">
        <div className="content text-center space-y-4">
          <p className="text-gray-500">No bio loaded.</p>
          <button onClick={() => router.push('/mirror')} className="btn-secondary">
            ← Back to Mirror
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page pb-52">
      <div className="content space-y-5">

        <ProgressStepper />

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => router.push('/mirror')}
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-gray-600"
          >
            ←
          </button>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Annotate
          </span>
          {falseCount > 0 && (
            <span className="ml-auto bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {falseCount} false
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 px-1">
          Tap a sentence to mark it as correct, false, or add a note.
        </p>

        {/* Sentence list */}
        <div className="space-y-2.5">
          {sentences.map((sentence, i) => {
            const ann = annotations[i]
            const cfg = ann ? VERDICT_CONFIG[ann.verdict] : null
            const isSelected = selected === i

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full text-left rounded-2xl p-4 border transition-all
                  ${cfg ? `${cfg.bg} border-l-4 ${cfg.bar}` : 'bg-white border-gray-100 shadow-card'}
                  ${isSelected ? 'ring-2 ring-accent ring-offset-1' : ''}
                `}
              >
                <p className="text-sm text-gray-800 leading-relaxed">{sentence}</p>
                <div className="flex items-center justify-between mt-1.5">
                  {ann ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg?.badge}`}>
                      {cfg?.label}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">tap to annotate</span>
                  )}
                  {ann?.correction && (
                    <span className="text-xs text-gray-500 italic truncate ml-2 max-w-[60%]">
                      → {ann.correction}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom drawer — annotation controls */}
      {selected !== null && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-card-lg p-5 space-y-4 z-50">
          <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto" />
          <p className="text-xs text-gray-500 line-clamp-2">
            &ldquo;{sentences[selected]}&rdquo;
          </p>

          {/* Verdict chips */}
          <div className="grid grid-cols-3 gap-2">
            {(['true', 'false', 'note'] as Verdict[]).map((v) => {
              const cfg = VERDICT_CONFIG[v]
              return (
                <button
                  key={v}
                  onClick={() => setDraft((d) => ({ ...d, verdict: v }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                    ${draft.verdict === v
                      ? v === 'true' ? 'bg-correct text-white border-correct'
                        : v === 'false' ? 'bg-wrong text-white border-wrong'
                        : 'bg-note text-white border-note'
                      : `${cfg.bg} border-transparent text-gray-700`
                    }`}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>

          {(draft.verdict === 'false' || draft.verdict === 'note') && (
            <textarea
              value={draft.correction || ''}
              onChange={(e) => setDraft((d) => ({ ...d, correction: e.target.value }))}
              placeholder="Version correcte…"
              rows={2}
              className="input-field resize-none"
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!draft.verdict}
              className="flex-1 bg-accent text-white py-3 rounded-2xl text-sm font-semibold disabled:opacity-40"
            >
              Save
            </button>
            {annotations[selected] && (
              <button
                onClick={handleRemove}
                className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-semibold"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => { setSelected(null); setDraft({}) }}
              className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-semibold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sticky footer — sign + continue */}
      {selected === null && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-4 py-4 space-y-2 z-40">
          {signError && <p className="text-xs text-wrong text-center">{signError}</p>}
          <div className="flex gap-2 max-w-sm mx-auto">
            {/* Wallet connected: show sign button */}
            {publicKey && falseCount > 0 && (
              <button
                onClick={handleSign}
                disabled={signing}
                className="flex-1 bg-accent text-white py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-50"
              >
                {signing ? 'Signing…' : `Publish on-chain (${falseCount})`}
              </button>
            )}

            {/* No wallet + false claims: connect wallet button */}
            {!publicKey && falseCount > 0 && (
              <button
                onClick={() => openWalletModal(true)}
                className="flex-1 bg-accent text-white py-3.5 rounded-2xl text-sm font-semibold"
              >
                Connect wallet to publish →
              </button>
            )}

            {/* Skip / Continue */}
            <button
              onClick={() => router.push('/investigate')}
              className={`${falseCount > 0 ? 'px-5' : 'flex-1'} bg-gray-100 text-gray-700 py-3.5 rounded-2xl text-sm font-semibold`}
            >
              {falseCount > 0 ? 'Skip' : 'Continue →'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
