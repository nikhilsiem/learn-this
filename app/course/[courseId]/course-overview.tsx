'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ProgressBar'
import { ChatSidebar } from '@/components/ChatSidebar'
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
  const [chatOpen, setChatOpen] = useState(false)

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
        <h1 className="text-3xl font-heading font-bold tracking-tight">{course.title}</h1>
        <p className="text-muted-foreground mt-1">{course.topic}</p>
        <div className="flex gap-2 mt-3">
          <Badge variant="secondary">{course.skill_level}</Badge>
          <Badge variant="outline">{course.goal}</Badge>
          <Badge variant="outline">{course.time_budget}</Badge>
        </div>
      </div>

      <ProgressBar completed={completedCount} total={course.modules.length} />

      <div className="space-y-4">
        <h2 className="text-xl font-heading font-semibold tracking-tight">Modules</h2>
        <div className="grid gap-3">
          {course.modules.map((mod) => {
            const prog = progress.find(p => p.module_index === mod.index)
            const completed = prog?.completed ?? false
            return (
              <Link key={mod.index} href={`/course/${course.id}/${mod.index}`}>
                <Card className={`transition-all hover:border-ring/50 ${completed ? 'border-primary/30' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {completed && (
                          <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">✓</span>
                        )}
                        <span className={completed ? 'text-primary' : ''}>Module {mod.index + 1}: {mod.title}</span>
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">{mod.estimatedMinutes} min</span>
                    </div>
                    <CardDescription>{mod.concepts.join(' · ')}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2">
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
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Capstone: {capstone.title}</CardTitle>
            <CardDescription>{capstone.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
              {capstone.steps.map((step: string, i: number) => (
                <li key={i} className="text-foreground/80">{step}</li>
              ))}
            </ol>
            {capstone.stretchGoals.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 text-foreground/80">Stretch goals</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {capstone.stretchGoals.map((g: string, i: number) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-3">
        <Link href="/" className="inline-flex items-center justify-center rounded-lg border border-border bg-card h-8 px-3 text-sm font-medium hover:bg-muted transition-colors">
          Create another course
        </Link>
        <Button variant="outline" size="sm" onClick={() => setChatOpen(true)}>
          Past conversations
        </Button>
      </div>

      <ChatSidebar
        courseId={course.id}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  )
}
