import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await params
  const url = new URL(req.url)
  const format = url.searchParams.get('format')

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (format === 'export') {
    const { data: modules } = await supabaseAdmin
      .from('module_content')
      .select('module_index, lesson_markdown')
      .eq('course_id', courseId)
      .order('module_index', { ascending: true })

    let markdown = `# ${course.title}\n\n`
    markdown += `> ${course.topic}  \n`
    markdown += `> Level: ${course.skill_level} · Goal: ${course.goal} · Time: ${course.time_budget}\n\n---\n\n`

    if (modules) {
      for (const mod of modules) {
        if (mod.lesson_markdown) {
          markdown += mod.lesson_markdown
          markdown += '\n\n---\n\n'
        }
      }
    }

    if (course.capstone) {
      markdown += `# Capstone: ${course.capstone.title}\n\n`
      markdown += `${course.capstone.description}\n\n`
      markdown += '## Steps\n\n'
      course.capstone.steps.forEach((step: string, i: number) => {
        markdown += `${i + 1}. ${step}\n`
      })
      if (course.capstone.stretchGoals?.length) {
        markdown += '\n## Stretch Goals\n\n'
        course.capstone.stretchGoals.forEach((g: string) => {
          markdown += `- ${g}\n`
        })
      }
    }

    return NextResponse.json({ markdown })
  }

  return NextResponse.json({
    id: course.id,
    title: course.title,
    topic: course.topic,
    skillLevel: course.skill_level,
    goal: course.goal,
    timeBudget: course.time_budget,
    modules: course.modules,
    capstone: course.capstone,
    createdAt: course.created_at,
  })
}
