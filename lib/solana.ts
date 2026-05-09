import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from '@solana/web3.js'

export const SOLANA_NETWORK = 'devnet' as const
export const connection = new Connection(clusterApiUrl(SOLANA_NETWORK), 'confirmed')

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

export async function hashClaim(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const bytes = Array.from(new Uint8Array(hashBuffer))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function buildCorrectionTx(
  corrections: { sentence: string; correction: string }[],
  signer: PublicKey
): Promise<Transaction> {
  const tx = new Transaction()

  for (const { sentence, correction } of corrections) {
    const hash = await hashClaim(sentence)
    // Truncate correction to 128 UTF-8 bytes
    const msgBytes = new TextEncoder().encode(correction || '')
    const truncated = new TextDecoder().decode(msgBytes.slice(0, 128))
    const memo = `QVERIFY|v1|${hash}|${truncated}`

    tx.add(
      new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
        data: Buffer.from(memo, 'utf-8'),
      })
    )
  }

  const { blockhash } = await connection.getLatestBlockhash()
  tx.recentBlockhash = blockhash
  tx.feePayer = signer

  return tx
}

export function solscanUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=devnet`
}
