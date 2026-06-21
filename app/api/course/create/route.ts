import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { model } from '@/lib/ai'
import { plannerPrompt } from '@/lib/prompts'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { CourseInput, ModuleMeta, Course } from '@/lib/types'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    let userId = session?.user?.id || token?.sub || ''

    if (!userId && (session?.user?.email || token?.email)) {
      const email = session?.user?.email || token?.email || ''
      const { data } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single() as unknown as PostgrestSingleResponse<{ id: string }>
      if (data) userId = data.id
    }

    if (!userId) {
      return NextResponse.json({
        error: 'Could not resolve user ID from session',
        hasSession: !!session,
        hasToken: !!token,
      }, { status: 401 })
    }

    const { allowed } = await checkRateLimit(userId, 10, 3600)
    if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const input: CourseInput = await req.json()

    const planResult = await model.generateContent(plannerPrompt(input))
    const planText = planResult.response.text()

    let parsed: { title: string; modules: ModuleMeta[] }
    try {
      parsed = JSON.parse(planText.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({ error: 'Planner returned invalid JSON', detail: planText.slice(0, 500) }, { status: 500 })
    }

  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .insert({
      user_id: userId,
      title: parsed.title,
      topic: input.topic,
      skill_level: input.skillLevel,
      goal: input.goal,
      time_budget: input.timeBudget,
      modules: parsed.modules,
    })
    .select()
    .single() as unknown as PostgrestSingleResponse<{ id: string; title: string; modules: ModuleMeta[]; skill_level: string; goal: string }>

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  generateAndSaveCapstone(course!)

  return NextResponse.json({ courseId: course!.id })
  } catch (e) {
    console.error('Course creation failed:', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function generateAndSaveCapstone(rawCourse: { id: string; title: string; modules: ModuleMeta[]; skill_level: string; goal: string }) {
  try {
    const { model } = await import('@/lib/ai')
    const { capstonePrompt } = await import('@/lib/prompts')
    const course: Course = {
      id: rawCourse.id,
      userId: '',
      title: rawCourse.title,
      topic: '',
      skillLevel: rawCourse.skill_level as Course['skillLevel'],
      goal: rawCourse.goal as Course['goal'],
      timeBudget: '',
      modules: rawCourse.modules,
      capstone: null,
      createdAt: '',
    }
    const result = await model.generateContent(capstonePrompt(course))
    const raw = result.response.text()
    const capstone = JSON.parse(raw.replace(/```json|```/g, '').trim())
    await supabaseAdmin
      .from('courses')
      .update({ capstone })
      .eq('id', course.id)
  } catch (e) {
    console.error('Capstone generation failed:', e)
  }
}
