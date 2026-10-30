'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, CircleCheck, ClipboardCheck, Clock, MessageCircle } from 'lucide-react'
import { LessonViewer } from '@/components/LessonViewer'
import { ChatSidebar } from '@/components/ChatSidebar'
import { Button } from '@/components/ui/button'
import type { ModuleMeta } from '@/lib/types'

interface Props {
  courseId: string
  courseTitle: string
  moduleIndex: number
  moduleCount: number
  module: ModuleMeta
  initiallyCompleted: boolean
}

export function ModuleView({ courseId, courseTitle, moduleIndex, moduleCount, module: mod, initiallyCompleted }: Props) {
  const router = useRouter()
  const [lessonDone, setLessonDone] = useState(false)
  const [completed, setCompleted] = useState(initiallyCompleted)
  const [saving, setSaving] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const handleComplete = useCallback(() => setLessonDone(true), [])

  async function markComplete() {
    setSaving(true)
    const res = await fetch(`/api/course/${courseId}/module/${moduleIndex}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    setSaving(false)
    if (res.ok) {
      setCompleted(true)
      router.refresh()
    }
  }

  const hasPrev = moduleIndex > 0
  const hasNext = moduleIndex < moduleCount - 1

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href={`/course/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> {courseTitle}
        </Link>

        <header className="mt-6 mb-8 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Module {moduleIndex + 1} of {moduleCount}
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{mod.title}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4" /> {mod.estimatedMinutes} min</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4" /> {mod.concepts.length} concepts</span>
            {completed && (
              <span className="inline-flex items-center gap-1.5 text-primary"><CircleCheck className="size-4" /> Completed</span>
            )}
          </div>
        </header>

        <section className="mb-10 rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-semibold mb-3">What you&apos;ll learn</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {mod.concepts.map(concept => (
              <li key={concept} className="flex items-start gap-2 text-sm text-foreground/85">
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                <span>{concept}</span>
              </li>
            ))}
          </ul>
        </section>

        <LessonViewer
          key={moduleIndex}
          courseId={courseId}
          moduleIndex={moduleIndex}
          onComplete={handleComplete}
        />
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
          {hasPrev && (
            <Link
              href={`/course/${courseId}/${moduleIndex - 1}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mr-2"
            >
              <ChevronLeft className="size-4" /> Previous
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={() => setChatOpen(true)}>
            <MessageCircle className="size-4" /> Ask a question
          </Button>
          <div className="flex-1" />
          <Link
            href={`/course/${courseId}/${moduleIndex}/quiz`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted h-8 px-3 text-sm font-medium transition-colors"
          >
            <ClipboardCheck className="size-4" /> Take quiz
          </Link>
          {!completed ? (
            <Button size="sm" onClick={markComplete} disabled={!lessonDone || saving}>
              {saving ? 'Saving...' : 'Mark complete'}
            </Button>
          ) : hasNext ? (
            <Link
              href={`/course/${courseId}/${moduleIndex + 1}`}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary text-primary-foreground h-8 px-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Next module <ChevronRight className="size-4" />
            </Link>
          ) : (
            <Link
              href={`/course/${courseId}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-8 px-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Back to course
            </Link>
          )}
        </div>
      </div>

      <ChatSidebar
        courseId={courseId}
        moduleIndex={moduleIndex}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  )
}
