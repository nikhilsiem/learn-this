'use client'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  courseId: string
  moduleIndex: number
  onComplete?: () => void
}

export function LessonViewer({ courseId, moduleIndex, onComplete }: Props) {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(true)
  const [streamDone, setStreamDone] = useState(false)

  useEffect(() => {
    if (streamDone) onComplete?.()
  }, [streamDone, onComplete])

  useEffect(() => {
    let cancelled = false

    const id = setTimeout(() => {
      fetch(`/api/course/${courseId}/module/${moduleIndex}`)
        .then(async res => {
          if (cancelled) return
          const cached = res.headers.get('X-Cached') === 'true'
          if (cached) {
            const { markdown } = await res.json()
            if (!cancelled) {
              setMarkdown(markdown)
              setLoading(false)
              setStreamDone(true)
            }
            return
          }

          const reader = res.body!.getReader()
          const decoder = new TextDecoder()
          if (!cancelled) setLoading(false)

          while (true) {
            const { done: streamDone, value } = await reader.read()
            if (streamDone) break
            const text = decoder.decode(value, { stream: true })
            if (!cancelled) setMarkdown(prev => prev + text)
          }
          if (!cancelled) setStreamDone(true)
        })
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [courseId, moduleIndex])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
      </div>
    )
  }

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
