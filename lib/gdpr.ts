export type Source = {
  id: string
  name: string
  type: 'data-broker' | 'scraped-profile' | 'search-index'
  contact: string
  legalBasis: string
  legalArticle: string
}

export const MOCK_SOURCES: Source[] = [
  {
    id: 'apollo',
    name: 'Apollo.io',
    type: 'data-broker',
    contact: 'privacy@apollo.io',
    legalBasis: "Droit à l'effacement",
    legalArticle: 'RGPD Article 17',
  },
  {
    id: 'scraped',
    name: 'Répertoire de profils scrapés',
    type: 'scraped-profile',
    contact: 'takedown@oldcv.info',
    legalBasis: "Droit à l'effacement",
    legalArticle: 'RGPD Article 17',
  },
  {
    id: 'google',
    name: 'Google Search Index',
    type: 'search-index',
    contact: 'https://removecontent.google.com',
    legalBasis: 'Droit à l\'oubli',
    legalArticle: 'Arrêt Google Spain (2014)',
  },
]

// Heuristic: which source types likely spread a given claim
export function getClaimSources(sentence: string): string[] {
  const s = sentence.toLowerCase()
  const ids = new Set<string>()

  // Professional role/company claims → data brokers aggregate LinkedIn
  if (/rejoint|head of|ceo|cto|fondateur|analyste|directeur|rôle|poste|représentait/.test(s)) {
    ids.add('apollo')
  }

  // Founder / community claims → scraped profiles + data brokers
  if (/fondateur|créateur|founder|organisé|lancé|bâti/.test(s)) {
    ids.add('apollo')
    ids.add('scraped')
  }

  // Event / institution claims → scraped web content
  if (/sommet|assemblée|conférence|hackathon|participé|invité|national|délégué/.test(s)) {
    ids.add('scraped')
  }

  // Everything surfaces in Google search index
  ids.add('google')

  return Array.from(ids)
}

export function buildGDPRRequest(
  source: Source,
  name: string,
  falseClaims: { sentence: string; correction: string }[],
  solanaSignature: string | null
): string {
  const claimsText = falseClaims
    .map(
      (c, i) =>
        `${i + 1}. INFORMATION INCORRECTE : "${c.sentence}"\n   CORRECTION : "${c.correction || '(suppression demandée)'}"`
    )
    .join('\n\n')

  const ref = solanaSignature
    ? `\nRéférence de vérification on-chain (Solana devnet) : ${solanaSignature}`
    : ''

  return `À qui de droit — ${source.name},

Je soussigné(e) ${name}, vous contacte dans le cadre de mes droits accordés par le Règlement Général sur la Protection des Données (RGPD).

Il est apparu que votre plateforme indexe des informations inexactes me concernant :

${claimsText}

Sur la base de l'${source.legalArticle} (${source.legalBasis}), je vous demande de :
1. Supprimer les informations inexactes de vos bases de données
2. Corriger les informations associées à mon profil
3. Confirmer par écrit le traitement de cette demande dans un délai de 30 jours
${ref}

Dans l'attente de votre réponse,

${name}`
}
