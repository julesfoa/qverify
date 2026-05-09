import mockBio from '@/data/mock_bio.json'
import type { Annotation } from './store'

// Pre-validated demo annotations — the 3 false claims from Jules's profile
// All three are LinkedIn likes misattributed as experience by AI scraping
export const DEMO_ANNOTATIONS: Record<number, Annotation> = {
  7: {
    verdict: 'false',
    correction:
      "Je n'ai jamais travaillé chez Altemis. J'ai liké un post d'un employé d'Altemis à la Paris Blockchain Week.",
  },
  8: {
    verdict: 'false',
    correction:
      "Je n'ai pas participé à ce sommet. J'ai liké le post d'un participant.",
  },
  12: {
    verdict: 'false',
    correction: "Je suis membre actif de Hyperliquid France, pas le fondateur.",
  },
}

export const CORRECT_VERSION: string = (mockBio as { correct_version?: { text?: string } })
  .correct_version?.text ?? ''
