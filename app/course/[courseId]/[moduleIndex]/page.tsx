'use client'
import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LessonViewer } from '@/components/LessonViewer'
import { Button } from '@/components/ui/button'
import { ChatSidebar } from '@/components/ChatSidebar'

export default function ModulePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const moduleIndex = parseInt(params.moduleIndex as string)
  const [lessonDone, setLessonDone] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const handleComplete = useCallback(() => {
    setLessonDone(true)
  }, [])

  async function markAsDone() {
    setMarkingDone(true)
    await fetch(`/api/course/${courseId}/module/${moduleIndex}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    router.refresh()
  }

  const nextModuleIndex = moduleIndex + 1

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <LessonViewer
        key={moduleIndex}
        courseId={courseId}
        moduleIndex={moduleIndex}
        onComplete={handleComplete}
      />

      {lessonDone && (
        <div className="flex flex-wrap gap-3 border-t pt-6">
          <Button onClick={markAsDone} disabled={markingDone}>
            {markingDone ? 'Saving...' : 'Mark as done'}
          </Button>
          <a
            href={`/course/${courseId}/${moduleIndex}/quiz`}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background h-8 px-2.5 text-sm font-medium hover:bg-muted"
          >
            Take quiz →
          </a>
          <Button variant="ghost" onClick={() => setChatOpen(true)}>
            Ask a question
          </Button>
        </div>
      )}

      {lessonDone && (
        <div className="text-center text-sm text-muted-foreground">
          <a
            href={`/course/${courseId}/${nextModuleIndex}`}
            className="underline inline-block"
          >
            Next module →
          </a>
        </div>
      )}

      <ChatSidebar
        courseId={courseId}
        moduleIndex={moduleIndex}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  )
}
