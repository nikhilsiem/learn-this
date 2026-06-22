import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  const moduleIndexStr = searchParams.get('moduleIndex')

  let query = supabaseAdmin
    .from('conversations')
    .select('id, title, created_at, updated_at, module_index')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false })

  if (courseId) query = query.eq('course_id', courseId)
  if (moduleIndexStr) query = query.eq('module_index', parseInt(moduleIndexStr))

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversations: data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, moduleIndex, title } = await req.json()

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      user_id: session.user.id,
      course_id: courseId,
      module_index: moduleIndex,
      title: title || '',
    })
    .select('id, title, created_at, updated_at, module_index')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversation: data })
}
