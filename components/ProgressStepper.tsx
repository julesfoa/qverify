'use client'

import { usePathname } from 'next/navigation'

const STEPS = [
  { label: 'Mirror', path: '/mirror' },
  { label: 'Annotate', path: '/annotate' },
  { label: 'Sign', path: '/annotate', secondary: true },
  { label: 'Act', path: '/investigate' },
]

const PATH_STEP: Record<string, number> = {
  '/mirror': 0,
  '/annotate': 1,
  '/investigate': 3,
}

export function ProgressStepper() {
  const pathname = usePathname()
  const current = PATH_STEP[pathname] ?? -1

  if (current === -1) return null

  return (
    <div className="flex items-center justify-center gap-0 mb-1">
      {['Mirror', 'Annotate', 'Act'].map((label, i) => {
        const stepIndex = [0, 1, 3][i]
        const done = current > stepIndex
        const active = current === stepIndex

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${done ? 'bg-correct text-white' : active ? 'bg-accent text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-accent' : done ? 'text-correct' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className={`w-10 h-0.5 mb-4 mx-1 ${done && current > stepIndex ? 'bg-correct' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
