import Link from 'next/link'

const STEPS = [
  {
    n: '01',
    title: 'Query',
    desc: 'We query Claude, Perplexity and GPT simultaneously — or you paste any AI output. Watch it generate a bio about you in real time.',
    icon: '🔍',
  },
  {
    n: '02',
    title: 'Annotate',
    desc: 'Tap each sentence. Mark it True, False, or add a note with the correct version. Your corrections feed directly into a verified profile.',
    icon: '✏️',
  },
  {
    n: '03',
    title: 'Publish on-chain',
    desc: 'Sign a Solana transaction. Your corrections are stored immutably — cryptographically signed by your wallet. No one can edit them.',
    icon: '⛓️',
  },
  {
    n: '04',
    title: 'Send takedowns',
    desc: 'We identify the source of each false claim — data brokers, scraped profiles, search indexes — and generate pre-filled GDPR Art. 17 erasure requests. One click to send.',
    icon: '⚖️',
  },
]

const PROBLEMS = [
  {
    wrong: 'AI says you worked at a company you never joined',
    source: 'LinkedIn like attributed as experience',
  },
  {
    wrong: 'AI says you attended an event you never went to',
    source: 'Liked post mistaken for attendance',
  },
  {
    wrong: 'AI says you founded something you just supported',
    source: 'Engagement conflated with ownership',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">Q</span>
          </div>
          <span className="font-bold text-gray-900">QVerify</span>
        </div>
        <Link href="/verify" className="text-sm font-semibold text-accent hover:text-accent-dark transition-colors">
          Try it →
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-accent-light text-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          Hackathon MVP · Solana + Claude
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
          AI will be asked about you.<br />
          <span className="text-accent">Own the answer.</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          AI systems generate authoritative-sounding profiles from wrong, outdated, or fabricated data.
          Recruiters, investors, and partners use this output before meeting you — and you have no right of reply.
          <br /><br />
          QVerify gives it back to you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-8 py-4 rounded-2xl hover:bg-accent-dark transition-colors"
          >
            Verify my AI profile →
          </Link>
          <a
            href="#how-it-works"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            How it works ↓
          </a>
        </div>
      </section>

      {/* Problem — real examples */}
      <section className="bg-surface px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-8">
            The problem — real AI hallucinations
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-card space-y-3">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-wrong/10 text-wrong rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✗</span>
                  <p className="text-sm font-medium text-gray-800 leading-snug">{p.wrong}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-400 mt-0.5">Why:</span>
                  <p className="text-xs text-gray-400 leading-snug">{p.source}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Root cause: AI systems scrape LinkedIn and confuse <strong>likes</strong> with <strong>experience</strong>.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 max-w-4xl mx-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-12">
          How it works
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center text-xl">
                {s.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-accent">{s.n}</span>
                  <p className="text-sm font-bold text-gray-900">{s.title}</p>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech */}
      <section className="bg-surface px-6 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Built with</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Claude (Anthropic)', 'Solana devnet', 'GDPR Art. 17', 'Next.js 16', 'Vercel AI Gateway'].map((t) => (
              <span key={t} className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          What does AI say about you?
        </h2>
        <p className="text-gray-500 mb-8">Find out in 30 seconds. No account needed.</p>
        <Link
          href="/verify"
          className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-10 py-4 rounded-2xl hover:bg-accent-dark transition-colors text-base"
        >
          Verify my AI profile →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6 text-center">
        <p className="text-xs text-gray-400">
          QVerify · Hackathon MVP · 2026 ·{' '}
          <span className="text-accent">Your right of reply, at internet scale.</span>
        </p>
      </footer>
    </main>
  )
}
