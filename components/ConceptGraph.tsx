'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ModuleMeta, Progress } from '@/lib/types'

interface Props {
  courseId: string
  modules: ModuleMeta[]
  progress: Progress[]
}

export function ConceptGraph({ courseId, modules, progress }: Props) {
  const pathname = usePathname()

  const completedIndices = new Set(
    progress.filter(p => p.completed).map(p => p.moduleIndex)
  )

  const getScore = (index: number) => {
    const p = progress.find(p => p.moduleIndex === index)
    return p?.quizScore ?? null
  }

  return (
    <nav className="space-y-1">
      {modules.map((mod) => {
        const isActive = pathname === `/course/${courseId}/${mod.index}`
        const isCompleted = completedIndices.has(mod.index)
        const isLocked = mod.prereqs.length > 0 && !mod.prereqs.every(i => completedIndices.has(i))
        const score = getScore(mod.index)

        return (
          <Link
            key={mod.index}
            href={isLocked ? '#' : `/course/${courseId}/${mod.index}`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive && 'bg-accent text-accent-foreground font-medium',
              !isActive && !isLocked && 'hover:bg-muted',
              isLocked && 'opacity-50 cursor-not-allowed',
            )}
            onClick={e => isLocked && e.preventDefault()}
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs">
              {isCompleted ? '✓' : isLocked ? '🔒' : mod.index + 1}
            </span>
            <span className="flex-1 truncate">{mod.title}</span>
            <span className="text-xs text-muted-foreground">{mod.estimatedMinutes}m</span>
            {score !== null && (
              <span className={cn(
                'text-xs font-medium',
                score >= 60 ? 'text-green-600' : 'text-orange-600',
              )}>
                {score}%
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
