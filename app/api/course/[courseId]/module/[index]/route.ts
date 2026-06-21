import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { streamingModel } from '@/lib/ai'
import { lessonPrompt } from '@/lib/prompts'
import { NextResponse } from 'next/server'

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
    .select('lesson_markdown')
    .eq('course_id', courseId)
    .eq('module_index', moduleIndex)
    .single()

  if (cached?.lesson_markdown) {
    return NextResponse.json({ markdown: cached.lesson_markdown, cached: true })
  }

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const mod = course.modules[moduleIndex]
  if (!mod) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

  const stream = await streamingModel.generateContentStream(lessonPrompt(mod, course))

  let fullText = ''
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream.stream) {
        const text = chunk.text()
        fullText += text
        controller.enqueue(encoder.encode(text))
      }
      controller.close()

      await supabaseAdmin.from('module_content').upsert({
        course_id: courseId,
        module_index: moduleIndex,
        lesson_markdown: fullText,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'course_id,module_index' })
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Cached': 'false',
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; index: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, index } = await params
  const { completed } = await req.json()

  await supabaseAdmin.from('progress').upsert({
    user_id: session.user.id,
    course_id: courseId,
    module_index: parseInt(index),
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }, { onConflict: 'user_id,course_id,module_index' })

  return NextResponse.json({ ok: true })
}
