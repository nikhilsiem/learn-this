'use client'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (streamDone) onComplete?.()
  }, [streamDone, onComplete])

  useEffect(() => {
    let cancelled = false

    const id = setTimeout(() => {
      fetch(`/api/course/${courseId}/module/${moduleIndex}`)
        .then(async res => {
          if (cancelled) return
          if (!res.ok) throw new Error(`Could not load this lesson (${res.status})`)

          // Cached lessons come back as JSON; fresh ones stream as plain text.
          const isJson = res.headers.get('content-type')?.includes('application/json')
          if (isJson) {
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
            const { done, value } = await reader.read()
            if (done) break
            const text = decoder.decode(value, { stream: true })
            if (!cancelled) setMarkdown(prev => prev + text)
          }
          if (!cancelled) setStreamDone(true)
        })
        .catch(err => {
          if (cancelled) return
          setError(err instanceof Error ? err.message : 'Could not load this lesson')
          setLoading(false)
        })
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [courseId, moduleIndex])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
        {error}. Refresh the page to try again.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-5" aria-busy="true">
        <p className="text-sm text-muted-foreground">Writing your lesson&hellip; this takes a few seconds the first time.</p>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-1/3 mt-8" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    )
  }

  return (
    <article className="prose prose-invert prose-lg max-w-none
      prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-foreground prose-headings:scroll-mt-24
      prose-h1:hidden
      prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border
      prose-h3:mt-8 prose-h3:text-xl prose-h3:text-primary
      prose-p:leading-8 prose-p:text-foreground/85
      prose-li:text-foreground/85 prose-li:marker:text-primary
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-strong:text-foreground
      prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.9em] prose-code:font-medium
      prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:shadow-sm
      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-foreground/85
      prose-hr:border-border
      prose-th:text-foreground prose-th:bg-muted prose-td:border-border
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
