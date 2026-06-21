import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import { CourseOverview } from './course-overview'

export default async function CoursePage({
  params,
}: {
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

  return <CourseOverview course={course} progress={progress ?? []} />
}
