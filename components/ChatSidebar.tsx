'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message { role: 'user' | 'assistant'; content: string }

interface Props {
  courseId: string
  moduleIndex: number
  open: boolean
  onClose: () => void
}

export function ChatSidebar({ courseId, moduleIndex, open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const allMessages = [...messages, userMsg]
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, moduleIndex, messages: allMessages }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value)
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: text },
      ])
    }
    setStreaming(false)
  }

  if (!open) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 border-l bg-background shadow-lg flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Ask about this lesson</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Ask any question about the lesson content.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
            <span className={`inline-block px-3 py-2 rounded-lg max-w-xs ${
              m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {m.content || '…'}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question..."
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <Button onClick={send} disabled={streaming || !input.trim()}>Send</Button>
      </div>
    </div>
  )
}
