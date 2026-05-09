import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'QVerify — AI will be asked about you. Own the answer.',
  description: 'Detect, annotate and remove AI-generated misinformation about you. Corrections stored on Solana.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
