'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function InputForm() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [skillLevel, setSkillLevel] = useState('beginner')
  const [goal, setGoal] = useState('understand')
  const [timeBudget, setTimeBudget] = useState('1 week')
  const [loading, setLoading] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPdf(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const { url } = await res.json()
    setTopic(`PDF:${url} — ${file.name}`)
    setUploadingPdf(false)
  }

  async function handleSubmit() {
    if (!topic.trim()) return
    setLoading(true)
    const res = await fetch('/api/course/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, skillLevel, goal, timeBudget }),
    })
    const { courseId, error } = await res.json()
    if (error) { alert(error); setLoading(false); return }
    router.push(`/course/${courseId}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <Label htmlFor="topic">What do you want to learn?</Label>
        <Textarea
          id="topic"
          placeholder="e.g. React hooks, Machine learning basics, https://en.wikipedia.org/wiki/..."
          value={topic}
          onChange={e => setTopic(e.target.value)}
          rows={3}
        />
        <div className="flex items-center gap-2">
          <label className="cursor-pointer text-sm text-muted-foreground underline">
            {uploadingPdf ? 'Uploading...' : 'Or upload a PDF'}
            <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploadingPdf} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Skill level</Label>
          <Select value={skillLevel} onValueChange={v => v && setSkillLevel(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>My goal</Label>
          <Select value={goal} onValueChange={v => v && setGoal(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="understand">Understand it</SelectItem>
              <SelectItem value="build">Build with it</SelectItem>
              <SelectItem value="teach">Teach it</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Time budget</Label>
          <Select value={timeBudget} onValueChange={v => v && setTimeBudget(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30 minutes">30 minutes</SelectItem>
              <SelectItem value="2 hours">2 hours</SelectItem>
              <SelectItem value="1 day">1 day</SelectItem>
              <SelectItem value="1 week">1 week</SelectItem>
              <SelectItem value="2 weeks">2 weeks</SelectItem>
              <SelectItem value="1 month">1 month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading || !topic.trim()} className="w-full" size="lg">
        {loading ? 'Building your course...' : 'Generate course →'}
      </Button>
    </div>
  )
}
