import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function PATCH(
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

  const { title } = await req.json()

  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
