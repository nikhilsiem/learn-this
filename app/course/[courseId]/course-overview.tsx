'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ProgressBar'
import type { CapstoneProject } from '@/lib/types'

interface CourseData {
  id: string
  title: string
  topic: string
  skill_level: string
  goal: string
  time_budget: string
  modules: Array<{
    index: number
    title: string
    concepts: string[]
    estimatedMinutes: number
  }>
  capstone: CapstoneProject | null
  created_at: string
}

interface ProgressData {
  module_index: number
  completed: boolean
  quiz_score: number | null
}

export function CourseOverview({ course, progress }: { course: CourseData; progress: ProgressData[] }) {
  const [capstone, setCapstone] = useState<CapstoneProject | null>(course.capstone)

  useEffect(() => {
    if (capstone) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/course/${course.id}`)
      const data = await res.json()
      if (data.capstone) {
        setCapstone(data.capstone)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [course.id, capstone])

  const completedCount = progress.filter(p => p.completed).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground mt-1">{course.topic}</p>
        <div className="flex gap-2 mt-3">
          <Badge variant="secondary">{course.skill_level}</Badge>
          <Badge variant="outline">{course.goal}</Badge>
          <Badge variant="outline">{course.time_budget}</Badge>
        </div>
      </div>

      <ProgressBar completed={completedCount} total={course.modules.length} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Modules</h2>
        <div className="grid gap-4">
          {course.modules.map((mod) => {
            const prog = progress.find(p => p.module_index === mod.index)
            const completed = prog?.completed ?? false
            return (
              <Link key={mod.index} href={`/course/${course.id}/${mod.index}`}>
                <Card className={`transition-colors hover:bg-muted/50 ${completed ? 'border-green-300 dark:border-green-700' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {completed && <span className="text-green-600">✓</span>}
                        {mod.index + 1}. {mod.title}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">{mod.estimatedMinutes} min</span>
                    </div>
                    <CardDescription>{mod.concepts.join(' · ')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {prog?.quiz_score !== null && prog?.quiz_score !== undefined && (
                      <Badge variant={prog.quiz_score >= 60 ? 'default' : 'destructive'}>
                        Quiz: {prog.quiz_score}%
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {capstone && (
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Capstone: {capstone.title}</h2>
          <p className="text-muted-foreground">{capstone.description}</p>
          <ol className="list-decimal list-inside space-y-1">
            {capstone.steps.map((step: string, i: number) => (
              <li key={i} className="text-sm">{step}</li>
            ))}
          </ol>
          {capstone.stretchGoals.length > 0 && (
            <div>
              <p className="text-sm font-medium mt-4">Stretch goals:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {capstone.stretchGoals.map((g: string, i: number) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <Link href="/" className="inline-flex items-center justify-center rounded-lg border border-border bg-background h-8 px-2.5 text-sm font-medium hover:bg-muted">
          Create another course
        </Link>
      </div>
    </div>
  )
}
