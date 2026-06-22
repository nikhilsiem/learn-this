import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('user_id')
    .eq('id', id)
    .single()

  if (convError || !conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conversation.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('user_id')
    .eq('id', id)
    .single()

  if (convError || !conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conversation.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { role, content } = await req.json()

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: id,
      role,
      content,
    })
    .select('id, role, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ message: data })
}
