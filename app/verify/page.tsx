'use client'

import { useRouter } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useStore, type EntityType } from '@/lib/store'

const ENTITY_OPTIONS: { value: EntityType; label: string; emoji: string; placeholder: string }[] = [
  { value: 'person', label: 'Person', emoji: '👤', placeholder: 'Jules Foa' },
  { value: 'brand', label: 'Brand', emoji: '🏢', placeholder: 'Stripe, Apple, OpenAI…' },
]

export default function LandingPage() {
  const router = useRouter()
  const { name, entityType, useMock, setName, setEntityType, setUseMock, reset } = useStore()

  const activeCfg = ENTITY_OPTIONS.find((o) => o.value === entityType)!

  function handleStart() {
    reset()
    setName(name)
    setEntityType(entityType)
    setUseMock(useMock)
    router.push('/mirror')
  }

  return (
    <main className="page justify-center">
      <div className="content space-y-5">

        {/* Logo */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent rounded-2xl mb-3">
            <span className="text-white text-2xl font-bold">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            AI will be asked<br />about you.
          </h1>
          <p className="text-gray-400 text-sm">Own the answer.</p>
        </div>

        {/* Person / Brand toggle */}
        <div className="card p-1.5">
          <div className="grid grid-cols-2 gap-1">
            {ENTITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setEntityType(opt.value); setName('') }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${entityType === opt.value
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide pl-1">
            {entityType === 'person' ? 'Your name' : 'Brand name'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={activeCfg.placeholder}
            className="input-field"
          />
        </div>

        {/* Demo toggle */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Demo mode</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {name.trim()
                ? `Paste what AI says about "${name}"`
                : 'Or paste any AI output on the next screen'}
            </p>
          </div>
          <button
            onClick={() => setUseMock(!useMock)}
            className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${useMock ? 'bg-accent' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useMock ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Wallet */}
        <div className="card flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">Solana wallet</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Publish corrections on-chain (optional)
            </p>
          </div>
          <div className="flex-shrink-0">
            <WalletMultiButton />
          </div>
        </div>

        {/* CTA */}
        <button onClick={handleStart} disabled={!name.trim()} className="btn-primary">
          Verify {entityType === 'person' ? 'my' : ''} AI profile →
        </button>

        <p className="text-center text-xs text-gray-400">
          Queries Claude · Corrections stored on Solana devnet
        </p>
      </div>
    </main>
  )
}
