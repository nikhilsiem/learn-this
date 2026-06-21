import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File
  if (!file || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'PDF required' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Max 5MB' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const path = `${session.user.id}/${Date.now()}.pdf`

  const { data, error } = await supabaseAdmin.storage
    .from('course-uploads')
    .upload(path, new Uint8Array(bytes), {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('course-uploads')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
