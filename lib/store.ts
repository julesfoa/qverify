import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Verdict = 'true' | 'false' | 'note'

export type Annotation = {
  verdict: Verdict
  correction?: string
}

export type EntityType = 'person' | 'brand'

interface QVerifyState {
  name: string
  entityType: EntityType
  useMock: boolean
  rawText: string
  sentences: string[]
  streamingDone: boolean
  annotations: Record<number, Annotation>
  solanaSignature: string | null

  setName: (name: string) => void
  setEntityType: (t: EntityType) => void
  setUseMock: (v: boolean) => void
  setRawText: (text: string) => void
  setSentences: (sentences: string[]) => void
  setStreamingDone: (done: boolean) => void
  setAnnotation: (index: number, annotation: Annotation) => void
  removeAnnotation: (index: number) => void
  setSolanaSignature: (sig: string) => void
  reset: () => void
}

const initial = {
  name: 'Jules Foa',
  entityType: 'person' as EntityType,
  useMock: true,
  rawText: '',
  sentences: [],
  streamingDone: false,
  annotations: {},
  solanaSignature: null,
}

export const useStore = create<QVerifyState>()(
  persist(
    (set) => ({
      ...initial,

      setName: (name) => set({ name }),
      setEntityType: (entityType) => set({ entityType }),
      setUseMock: (useMock) => set({ useMock }),
      setRawText: (rawText) => set({ rawText }),
      setSentences: (sentences) => set({ sentences }),
      setStreamingDone: (streamingDone) => set({ streamingDone }),
      setAnnotation: (index, annotation) =>
        set((s) => ({ annotations: { ...s.annotations, [index]: annotation } })),
      removeAnnotation: (index) =>
        set((s) => {
          const next = { ...s.annotations }
          delete next[index]
          return { annotations: next }
        }),
      setSolanaSignature: (solanaSignature) => set({ solanaSignature }),
      reset: () => set(initial),
    }),
    {
      name: 'qverify',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return sessionStorage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
    }
  )
)
