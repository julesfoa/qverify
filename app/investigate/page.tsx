'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { MOCK_SOURCES, buildGDPRRequest, getClaimSources } from '@/lib/gdpr'
import { solscanUrl } from '@/lib/solana'
import { CORRECT_VERSION } from '@/lib/demo'
import { ProgressStepper } from '@/components/ProgressStepper'

const SOURCE_META: Record<string, { icon: string; label: string; color: string }> = {
  apollo:  { icon: '🗄️', label: 'Apollo.io',   color: 'bg-blue-50 text-blue-600 border-blue-200' },
  scraped: { icon: '📄', label: 'Profil scrapé', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  google:  { icon: '🔍', label: 'Google',        color: 'bg-green-50 text-green-600 border-green-200' },
}

function CopyButton({ text, label = 'Copy', className = '' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors ${className || 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {copied ? '✓ Copied!' : label}
    </button>
  )
}

export default function InvestigatePage() {
  const router = useRouter()
  const { name, sentences, annotations, solanaSignature, reset } = useStore()
  const [expanded, setExpanded] = useState<string | null>(null)

  const falseClaims = useMemo(
    () =>
      Object.entries(annotations)
        .filter(([, a]) => a.verdict === 'false' || a.verdict === 'note')
        .map(([i, a]) => ({
          index: Number(i),
          sentence: sentences[Number(i)] || '',
          correction: a.correction || '',
          sources: getClaimSources(sentences[Number(i)] || ''),
        })),
    [annotations, sentences]
  )

  // Count how many false claims each source spreads
  const sourceClaimCount = useMemo(() => {
    const counts: Record<string, number> = {}
    falseClaims.forEach((c) => {
      c.sources.forEach((s) => {
        counts[s] = (counts[s] || 0) + 1
      })
    })
    return counts
  }, [falseClaims])

  const allRequests = useMemo(
    () => MOCK_SOURCES.map((s) => buildGDPRRequest(s, name, falseClaims, solanaSignature)).join('\n\n---\n\n'),
    [name, falseClaims, solanaSignature]
  )

  return (
    <main className="page pb-16">
      <div className="content space-y-5">

        <ProgressStepper />

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => router.push('/annotate')} className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-gray-600">←</button>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Take action</span>
        </div>

        {/* On-chain confirmation */}
        {solanaSignature ? (
          <div className="card bg-correct-bg border border-correct/30 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-correct text-lg">✓</span>
              <p className="text-sm font-semibold text-gray-900">Corrections on Solana</p>
            </div>
            <p className="text-xs text-gray-500">
              Your corrections are immutably signed. No one can edit this record.
            </p>
            <a href={solscanUrl(solanaSignature)} target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline break-all">
              View on Solscan →
            </a>
          </div>
        ) : (
          <div className="card bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400">Corrections not published on-chain. Connect Phantom to create an immutable record.</p>
          </div>
        )}

        {/* Verified profile — the "after" state */}
        {falseClaims.length > 0 && CORRECT_VERSION && (
          <details className="card overflow-hidden p-0 group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-correct flex items-center justify-center text-white text-xs">✓</span>
                <p className="text-sm font-semibold text-gray-900">Verified profile</p>
                <span className="text-xs bg-correct/10 text-correct font-semibold px-2 py-0.5 rounded-full">After correction</span>
              </div>
              <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-3">
              <p className="text-xs text-gray-400">
                This is the verified version — built from your confirmed corrections.
                {solanaSignature && ' Signed by your wallet. Immutable on Solana.'}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{CORRECT_VERSION}</p>
              {solanaSignature && (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-correct flex items-center justify-center text-white text-[10px]">✓</span>
                  <a
                    href={solscanUrl(solanaSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent underline"
                  >
                    On-chain proof →
                  </a>
                </div>
              )}
            </div>
          </details>
        )}

        {/* False claims with source chips */}
        {falseClaims.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              {falseClaims.length} false claim{falseClaims.length !== 1 ? 's' : ''} — spreading on
            </p>
            {falseClaims.map((c) => (
              <div key={c.index} className="card bg-wrong-bg border border-wrong/20 border-l-4 border-l-wrong space-y-2">
                <p className="text-sm text-gray-800 leading-relaxed">{c.sentence}</p>
                {c.correction && (
                  <p className="text-xs text-gray-500 italic">→ {c.correction}</p>
                )}
                {/* Source chips */}
                <div className="flex flex-wrap gap-1.5">
                  {c.sources.map((sid) => {
                    const meta = SOURCE_META[sid]
                    if (!meta) return null
                    return (
                      <span
                        key={sid}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${meta.color}`}
                      >
                        <span>{meta.icon}</span>
                        {meta.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sources */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            Sources — demandes RGPD générées
          </p>

          {MOCK_SOURCES.map((source) => {
            const request = buildGDPRRequest(source, name, falseClaims, solanaSignature)
            const isOpen = expanded === source.id
            const meta = SOURCE_META[source.id]
            const claimCount = sourceClaimCount[source.id] || 0

            return (
              <div key={source.id} className="card overflow-hidden p-0">
                <button
                  onClick={() => setExpanded(isOpen ? null : source.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className="text-2xl w-9 text-center flex-shrink-0">{meta?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{source.name}</p>
                      {claimCount > 0 && (
                        <span className="text-xs font-bold bg-wrong/10 text-wrong px-2 py-0.5 rounded-full">
                          {claimCount} claim{claimCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {source.legalArticle} · {source.legalBasis}
                    </p>
                  </div>
                  <span className="text-gray-300 text-xs flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                    {/* Which claims this source spreads */}
                    {claimCount > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-gray-400">Claims this source spreads:</p>
                        {falseClaims
                          .filter((c) => c.sources.includes(source.id))
                          .map((c) => (
                            <div key={c.index} className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100 leading-relaxed">
                              {c.sentence.length > 80 ? c.sentence.slice(0, 80) + '…' : c.sentence}
                            </div>
                          ))}
                      </div>
                    )}
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                      {request}
                    </pre>
                    <div className="flex gap-2">
                      <CopyButton text={request} className="bg-accent text-white hover:bg-accent-dark" />
                      {source.contact.startsWith('http') ? (
                        <a href={source.contact} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">
                          Open form ↗
                        </a>
                      ) : (
                        <a
                          href={`mailto:${source.contact}?subject=${encodeURIComponent(`Demande RGPD — ${name}`)}&body=${encodeURIComponent(request)}`}
                          className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          Email ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Copy all */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Copy all 3 requests</p>
            <p className="text-xs text-gray-400 mt-0.5">Ready to send</p>
          </div>
          <CopyButton text={allRequests} label="Copy all" className="bg-accent text-white hover:bg-accent-dark" />
        </div>

        <button onClick={() => { reset(); router.push('/verify') }} className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-2">
          ↺ Reset demo
        </button>
      </div>
    </main>
  )
}
