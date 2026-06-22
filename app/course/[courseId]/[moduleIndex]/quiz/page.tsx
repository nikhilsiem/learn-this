'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QuizCard } from '@/components/QuizCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { QuizQuestion } from '@/lib/types'

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const moduleIndex = parseInt(params.moduleIndex as string)
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/course/${courseId}/module/${moduleIndex}/quiz`)
      .then(async res => {
        if (!res.ok) {
          const { error } = await res.json()
          setError(error || 'Failed to load quiz')
          return
        }
        const { questions } = await res.json()
        setQuestions(questions)
      })
      .finally(() => setLoading(false))
  }, [courseId, moduleIndex])

  async function handleComplete(quizScore: number) {
    setScore(quizScore)
    await fetch(`/api/course/${courseId}/module/${moduleIndex}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: quizScore }),
    })
    router.refresh()
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-7 bg-muted rounded w-3/4" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>Back to lesson</Button>
      </div>
    )
  }

  if (!questions) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Module {moduleIndex + 1}</p>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Quiz</h1>
        <p className="text-sm text-muted-foreground mt-1">Test your understanding of this module</p>
      </div>

      <QuizCard questions={questions} onComplete={handleComplete} />

      {score !== null && (
        <div className="mt-8 space-y-4 text-center">
          <Badge className="text-base px-4 py-1.5" variant={score >= 60 ? 'default' : 'destructive'}>
            Score: {score}%
          </Badge>
          <div className="flex gap-3 justify-center">
            <a
              href={`/course/${courseId}/${moduleIndex}`}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card h-8 px-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              Back to lesson
            </a>
            <a
              href={`/course/${courseId}/${moduleIndex + 1}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-8 px-3 text-sm font-medium hover:bg-primary/80 transition-colors"
            >
              Next module →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
