import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ProgressBar'
import type { ModuleMeta } from '@/lib/types'

interface CourseRow {
  id: string
  title: string
  topic: string
  skill_level: string
  goal: string
  modules: ModuleMeta[]
  created_at: string
}

interface ProgressRow {
  course_id: string
  module_index: number
  completed: boolean
  quiz_score: number | null
  completed_at: string | null
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function MyCoursesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  const [{ data: courses }, { data: progress }] = await Promise.all([
    supabaseAdmin
      .from('courses')
      .select('id, title, topic, skill_level, goal, modules, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('progress')
      .select('course_id, module_index, completed, quiz_score, completed_at')
      .eq('user_id', session.user.id),
  ])

  const rows = (courses ?? []) as CourseRow[]
  const allProgress = (progress ?? []) as ProgressRow[]

  const summaries = rows.map(course => {
    const mine = allProgress.filter(p => p.course_id === course.id)
    const done = new Set(mine.filter(p => p.completed).map(p => p.module_index))
    const scores = mine.map(p => p.quiz_score).filter((s): s is number => s !== null)
    const nextModule = course.modules.find(m => !done.has(m.index))
    const lastActive = mine
      .map(p => p.completed_at)
      .filter((d): d is string => !!d)
      .sort()
      .at(-1)
    return {
      course,
      completed: done.size,
      total: course.modules.length,
      avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      nextModule,
      lastActive: lastActive ?? null,
    }
  })

  const totalCompleted = summaries.reduce((n, s) => n + s.completed, 0)
  const allScores = allProgress.map(p => p.quiz_score).filter((s): s is number => s !== null)
  const overallAvg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-heading font-semibold tracking-tight">
            Learn&nbsp;<span className="text-primary">This</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-8 px-3 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            New course
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">My courses</h1>
          <p className="text-muted-foreground mt-1">Pick up where you left off.</p>
        </div>

        {rows.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-2xl font-heading font-bold">{rows.length}</p>
              <p className="text-xs text-muted-foreground">{rows.length === 1 ? 'Course' : 'Courses'}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-2xl font-heading font-bold">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Modules completed</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-2xl font-heading font-bold">{overallAvg !== null ? `${overallAvg}%` : '–'}</p>
              <p className="text-xs text-muted-foreground">Average quiz score</p>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4">
            <p className="text-muted-foreground">You haven&apos;t created a course yet.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-9 px-4 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Create your first course
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {summaries.map(({ course, completed, total, avgScore, nextModule, lastActive }) => {
              const finished = total > 0 && completed >= total
              return (
                <li key={course.id} className="rounded-xl border border-border bg-card p-5 space-y-4 transition-colors hover:border-ring/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <Link href={`/course/${course.id}`} className="font-heading text-lg font-semibold leading-snug hover:text-primary transition-colors">
                        {course.title}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">{course.topic}</p>
                    </div>
                    {finished && <Badge>Completed</Badge>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{course.skill_level}</Badge>
                    <Badge variant="outline">{course.goal}</Badge>
                    {avgScore !== null && <Badge variant="outline">Avg quiz {avgScore}%</Badge>}
                  </div>

                  <ProgressBar completed={completed} total={total} />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {lastActive ? `Last studied ${timeAgo(lastActive)}` : `Created ${timeAgo(course.created_at)}`}
                    </p>
                    <Link
                      href={nextModule ? `/course/${course.id}/${nextModule.index}` : `/course/${course.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-8 px-3 text-sm font-medium transition-colors"
                    >
                      {finished ? 'Review course' : completed === 0 ? 'Start course' : `Continue: Module ${(nextModule?.index ?? 0) + 1}`}
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
