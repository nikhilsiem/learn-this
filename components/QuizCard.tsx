'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import type { QuizQuestion } from '@/lib/types'

interface Props {
  questions: QuizQuestion[]
  onComplete: (score: number) => void
}

export function QuizCard({ questions, onComplete }: Props) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)

  const q = questions[current]

  function handleAnswer(answer: string) {
    setAnswers(prev => ({ ...prev, [q.id]: answer }))
  }

  function handleNext() {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
    } else {
      setShowResults(true)
      const mcqs = questions.filter(q => q.type === 'mcq')
      const correct = mcqs.filter(q => answers[q.id] === q.answer).length
      const openAnswered = questions.filter(q => q.type === 'open' && (answers[q.id]?.trim().length ?? 0) > 20).length
      const total = mcqs.length + questions.filter(q => q.type === 'open').length
      const score = Math.round(((correct + openAnswered) / total) * 100)
      onComplete(score)
    }
  }

  if (showResults) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-heading font-semibold">Quiz complete</h2>
        {questions.map((q, i) => (
          <div key={q.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <p className="font-medium text-sm">{i + 1}. {q.question}</p>
            {q.type === 'mcq' && (
              <div className="space-y-1.5">
                {q.options!.map(opt => (
                  <div key={opt} className={`px-3 py-1.5 rounded-lg text-sm ${
                    opt === q.answer ? 'bg-primary/10 text-primary' :
                    opt === answers[q.id] && opt !== q.answer ? 'bg-destructive/10 text-destructive' :
                    'text-muted-foreground'
                  }`}>{opt}</div>
                ))}
              </div>
            )}
            {q.type === 'open' && (
              <p className="text-sm text-muted-foreground">Your answer: {answers[q.id] || '(no answer)'}</p>
            )}
            <p className="text-sm border-l-2 border-primary/30 pl-3 text-muted-foreground">{q.explanation}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline">Question {current + 1} of {questions.length}</Badge>
        <span className="text-xs text-muted-foreground">{q.type === 'mcq' ? 'Multiple choice' : 'Open answer'}</span>
      </div>

      <p className="text-base font-heading font-medium">{q.question}</p>

      {q.type === 'mcq' ? (
        <div className="space-y-2">
          {q.options!.map(opt => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                answers[q.id] === opt
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border hover:bg-muted text-foreground'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <Textarea
          placeholder="Write your answer..."
          rows={4}
          value={answers[q.id] || ''}
          onChange={e => handleAnswer(e.target.value)}
        />
      )}

      <Button
        onClick={handleNext}
        disabled={!answers[q.id]}
        className="w-full"
      >
        {current < questions.length - 1 ? 'Next question →' : 'See results →'}
      </Button>
    </div>
  )
}
