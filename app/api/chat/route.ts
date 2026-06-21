import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { streamingModel } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, moduleIndex, messages } = await req.json()

  const { data } = await supabaseAdmin
    .from('module_content')
    .select('lesson_markdown')
    .eq('course_id', courseId)
    .eq('module_index', moduleIndex)
    .single() as unknown as { data: { lesson_markdown: string } | null }

  const systemContext = data?.lesson_markdown
    ? `You are a helpful tutor. Answer questions about the following lesson content only. Be concise (2–4 sentences). If the question is unrelated, say so.\n\nLesson content:\n${data.lesson_markdown.slice(0, 4000)}`
    : 'You are a helpful tutor. Answer the learner\'s questions concisely.'

  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const chat = streamingModel.startChat({
    history: [
      { role: 'user', parts: [{ text: systemContext }] },
      { role: 'model', parts: [{ text: 'Understood. I will answer questions about this lesson.' }] },
      ...history,
    ],
  })

  const lastMessage = messages[messages.length - 1].content
  const result = await chat.sendMessageStream(lastMessage)

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        controller.enqueue(encoder.encode(chunk.text()))
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
