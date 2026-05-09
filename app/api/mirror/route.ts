import { streamText } from 'ai'
import mockBio from '@/data/mock_bio.json'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function mockStream(text: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (const word of text.split(/\s+/)) {
        controller.enqueue(encoder.encode(word + ' '))
        await new Promise((r) => setTimeout(r, 30))
      }
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mock = url.searchParams.get('mock') === 'true'
  const name = url.searchParams.get('name') || 'Jules Foa'

  const sentences = mockBio.sentences as string[]

  // Mock path — preferred for demo. Add ?mock=true to use pre-validated bio.
  if (mock || !process.env.AI_GATEWAY_API_KEY) {
    return mockStream(sentences.join(' '))
  }

  // Real path — AI Gateway with OIDC auth (vercel env pull) or AI_GATEWAY_API_KEY
  // Model: anthropic/claude-sonnet-4.6 (dots for version, not hyphens)
  const result = streamText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: 'anthropic/claude-sonnet-4.6' as any,
    system: `You are an AI assistant that generates professional biographical profiles.
Generate a confident, authoritative profile from training data.
Write in third person, present tense. 150-200 words maximum. Do not acknowledge uncertainty.`,
    prompt: `Generate a biographical profile for: ${name}`,
    maxOutputTokens: 300,
  })

  return result.toTextStreamResponse()
}
