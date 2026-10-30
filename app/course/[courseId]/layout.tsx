import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CourseSidebar } from './course-sidebar'
import { ProgressBar } from '@/components/ProgressBar'
import type { Progress } from '@/lib/types'

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courseId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  const { courseId } = await params

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  const { data: progress } = await supabaseAdmin
    .from('progress')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId)

  const progressRows: Progress[] = (progress ?? []).map(p => ({
    moduleIndex: p.module_index,
    completed: !!p.completed,
    quizScore: p.quiz_score ?? null,
  }))
  const completedCount = progressRows.filter(p => p.completed).length

  return (
    <div className="flex flex-1">
      <aside className="w-72 border-r hidden md:block overflow-y-auto p-4 space-y-4">
        <Link href="/courses" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← My courses
        </Link>
        <div className="space-y-3">
          <div>
            <h2 className="font-heading font-semibold text-base leading-snug">{course.title}</h2>
            <p className="text-xs text-muted-foreground mt-1 truncate">{course.topic}</p>
          </div>
          <ProgressBar completed={completedCount} total={course.modules.length} />
        </div>
        <CourseSidebar
          courseId={courseId}
          modules={course.modules}
          progress={progressRows}
        />
      </aside>
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
