import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ModuleView } from './module-view'
import type { ModuleMeta } from '@/lib/types'

export default async function ModulePage({
  params,
}: {
  params: Promise<{ courseId: string; moduleIndex: string }>
}) {
  const { courseId, moduleIndex: rawIndex } = await params
  const moduleIndex = parseInt(rawIndex)
  const session = await auth()

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('title, modules')
    .eq('id', courseId)
    .single()

  const modules: ModuleMeta[] = course?.modules ?? []
  const mod = modules[moduleIndex]
  if (!course || !mod) notFound()

  const { data: progress } = await supabaseAdmin
    .from('progress')
    .select('completed')
    .eq('user_id', session?.user?.id ?? '')
    .eq('course_id', courseId)
    .eq('module_index', moduleIndex)
    .maybeSingle()

  return (
    <ModuleView
      courseId={courseId}
      courseTitle={course.title}
      moduleIndex={moduleIndex}
      moduleCount={modules.length}
      module={mod}
      initiallyCompleted={!!progress?.completed}
    />
  )
}
