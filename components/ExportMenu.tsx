'use client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface Props {
  courseId: string
  courseTitle: string
}

export function ExportMenu({ courseId, courseTitle }: Props) {
  async function exportMarkdown() {
    const res = await fetch(`/api/course/${courseId}?format=export`)
    const { markdown } = await res.json()
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${courseTitle.replace(/\s+/g, '-').toLowerCase()}.md`
    a.click()
  }

  async function copyMarkdown() {
    const res = await fetch(`/api/course/${courseId}?format=export`)
    const { markdown } = await res.json()
    await navigator.clipboard.writeText(markdown)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm">Export</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportMarkdown}>Download as Markdown</DropdownMenuItem>
        <DropdownMenuItem onClick={copyMarkdown}>Copy Markdown</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
