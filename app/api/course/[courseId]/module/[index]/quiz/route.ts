import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { model } from '@/lib/ai'
import { quizPrompt } from '@/lib/prompts'
import { NextResponse } from 'next/server'
import type { ModuleMeta } from '@/lib/types'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; index: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, index } = await params
  const moduleIndex = parseInt(index)

  const { data: cached } = await supabaseAdmin
    .from('module_content')
    .select('quiz_json')
    .eq('course_id', courseId)
    .eq('module_index', moduleIndex)
    .single()

  if (cached?.quiz_json) return NextResponse.json({ questions: cached.quiz_json })

  const { data: content } = await supabaseAdmin
    .from('module_content')
    .select('lesson_markdown')
    .eq('course_id', courseId)
    .eq('module_index', moduleIndex)
    .single()

  if (!content?.lesson_markdown) {
    return NextResponse.json({ error: 'Complete the lesson first' }, { status: 400 })
  }

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('modules')
    .eq('id', courseId)
    .single() as unknown as { data: { modules: ModuleMeta[] } | null }

  const mod = course!.modules[moduleIndex]

  const result = await model.generateContent(quizPrompt(mod, content.lesson_markdown))
  const raw = result.response.text()
  const questions = JSON.parse(raw.replace(/```json|```/g, '').trim())

  await supabaseAdmin
    .from('module_content')
    .update({ quiz_json: questions })
    .eq('course_id', courseId)
    .eq('module_index', moduleIndex)

  return NextResponse.json({ questions })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; index: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, index } = await params
  const { score } = await req.json()

  await supabaseAdmin.from('progress').upsert({
    user_id: session.user.id,
    course_id: courseId,
    module_index: parseInt(index),
    quiz_score: score,
    completed: score >= 60,
    completed_at: score >= 60 ? new Date().toISOString() : null,
  }, { onConflict: 'user_id,course_id,module_index' })

  return NextResponse.json({ ok: true })
}
