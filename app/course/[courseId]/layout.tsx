import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import { CourseSidebar } from './course-sidebar'

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

  return (
    <div className="flex flex-1">
      <aside className="w-72 border-r hidden md:block overflow-y-auto p-4 space-y-4">
        <div>
          <h2 className="font-semibold text-sm truncate">{course.title}</h2>
          <p className="text-xs text-muted-foreground truncate">{course.topic}</p>
        </div>
        <CourseSidebar
          courseId={courseId}
          modules={course.modules}
          progress={progress ?? []}
        />
      </aside>
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
