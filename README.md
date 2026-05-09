# QVerify

> **Your right of reply, at internet scale.**

AI systems generate authoritative-sounding profiles from wrong, outdated, or fabricated data. Recruiters, investors, and partners use this output before meeting you — and you have no right of reply. QVerify gives it back.

---

## Demo arc (2 minutes)

| Step | Screen | What happens |
|------|--------|-------------|
| 1 | **Mirror** | Type your name. Claude generates a bio live — wrong job titles, fake event attendance, misattributed companies. Or paste AI output from ChatGPT / Perplexity / Google. |
| 2 | **Annotate** | Tap each false sentence. Mark it False, add the correction. In demo mode the 3 known wrong claims are pre-highlighted. |
| 3 | **Sign** | Hit "Publish on-chain." Phantom signs a Solana transaction. Each correction is hashed and stored permanently on devnet. |
| 4 | **Investigate** | See which sources (Apollo.io, scraped profiles, Google index) spread each claim. Open the pre-filled GDPR Art. 17 erasure request per source. One click to copy or email. |
| + | **Verified profile** | After correction: a clean, wallet-signed "after" bio opens via the accordion — your canonical truth, linked to the Solscan proof. |

---

## Quick start

```bash
cp .env.example .env.local
npm install --legacy-peer-deps
npm run dev
```

Open **http://localhost:3001** (port 3000 may already be in use).

### Demo mode (no API key needed)

Leave `AI_GATEWAY_API_KEY` blank. The app streams Jules Foa's pre-validated wrong bio automatically — 3 false claims, 3 source attributions, 3 GDPR requests, all wired up. The demo runs end-to-end without any external service.

---

## Environment

```bash
# .env.local
AI_GATEWAY_API_KEY=        # optional — Vercel AI Gateway key
                           # blank = demo mode (mock bio streamed automatically)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

**Preferred auth (no key rotation):**
```bash
vercel login && vercel link
vercel env pull .env.local   # provisions VERCEL_OIDC_TOKEN, no API key needed
```

---

## Solana setup

1. Install [Phantom](https://phantom.app) and switch to **Devnet**
2. Fund your wallet:
   ```bash
   solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet
   ```
3. Connect wallet on the `/verify` screen

Corrections are stored via the **Solana Memo Program** (no program deployment needed). Each correction memo format:
```
QVERIFY|v1|<base64url-SHA256-of-claim>|<correction-text-128-bytes-max>
```

### Custom Anchor program (for prize judging)

The `onchain/` directory contains a full Anchor program with a `CorrectionLog` PDA (209 bytes). Deploy optionally:
```bash
cd onchain && anchor build && anchor deploy --provider.cluster devnet
```

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing — problem, how it works, CTA |
| `/verify` | App entry — name input, person/brand toggle, wallet connect, demo toggle |
| `/mirror` | Stream bio from Claude OR paste any AI output |
| `/annotate` | Tap sentences to annotate, sign Solana tx |
| `/investigate` | Source attribution, GDPR requests, verified profile |
| `/api/mirror` | Streaming route — AI Gateway or mock fallback |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 — App Router, webpack (Solana polyfills) |
| Styling | Tailwind CSS v3 — custom tokens: `accent` #FF5873, `surface`, `card`, `wrong`, `correct` |
| State | Zustand v5 with sessionStorage persist |
| AI | Vercel AI SDK v6 — `streamText`, `maxOutputTokens`, AI Gateway string routing |
| Model | `anthropic/claude-sonnet-4.6` via Vercel AI Gateway |
| Solana | `@solana/web3.js` · Memo Program · Phantom wallet adapter |
| On-chain | Solana devnet — claim hash + correction stored per annotation |

### Known build notes

- `bundler: 'webpack'` is not a valid Next.js 16 config key — use `--webpack` CLI flag (already in scripts)
- `ai@6` requires `zod@^3.25.76` — pinned explicitly in `package.json` to override parent directory zod
- `maxOutputTokens` is the AI SDK v6 param name (not `maxTokens`)
- Wallet adapter components require `"use client"` — all providers in `app/providers.tsx`

---

## Pre-hackathon checklist

```
[ ] cp .env.example .env.local
[ ] npm install --legacy-peer-deps
[ ] solana airdrop 2 <wallet> --url devnet  (fund before the clock starts)
[ ] Open /verify → turn on demo mode → go through full flow → confirm Solscan link works
[ ] Time the 2-minute demo arc
[ ] Deploy to Vercel: vercel login && vercel link && vercel deploy --prod
```

---

## Judge Q&A

**"Can't people just lie about their corrections?"**
Every correction is wallet-signed and timestamped on Solana. The claim hash proves which sentence was corrected and when. Immutable.

**"Why Solana?"**
Sub-cent transactions, 400ms finality, public and permanent. The correction cost is negligible; the proof is forever.

**"Is GDPR actually enforceable against AI companies?"**
Art. 17 (right to erasure) and Art. 16 (rectification) apply to EU-based data processors. We generate the pre-filled request. The user is the legal actor. Clean liability on our side.

**"What's the business model?"**
Freemium: annotate free, sign free. Premium = GDPR filing service with email delivery + follow-up tracking. Brand tier = B2B API for verified profiles at scale.

**"Why not just email the company directly?"**
You'd need to identify which of 200+ data brokers has the wrong data, know the correct legal basis per jurisdiction, write the request from scratch, and track follow-ups. We automate all of it in 90 seconds.

---

## File map

```
app/
  page.tsx              marketing landing
  verify/page.tsx       app entry form
  mirror/page.tsx       bio stream + paste mode
  annotate/page.tsx     sentence annotation + Solana sign
  investigate/page.tsx  source attribution + GDPR requests
  api/mirror/route.ts   streaming endpoint (AI Gateway / mock)
  providers.tsx         wallet adapter + Buffer polyfill
lib/
  store.ts              Zustand state (name, sentences, annotations, signature)
  solana.ts             Memo program tx builder + hashClaim
  gdpr.ts               MOCK_SOURCES + buildGDPRRequest + getClaimSources
  demo.ts               DEMO_ANNOTATIONS + CORRECT_VERSION
components/
  ProgressStepper.tsx   Mirror → Annotate → Act indicator
data/
  mock_bio.json         18 pre-tokenized sentences, corrections, verified version
onchain/
  programs/qverify/     Anchor program (CorrectionLog PDA, 209 bytes)
```
