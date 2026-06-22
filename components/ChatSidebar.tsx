'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message { role: 'user' | 'assistant'; content: string }
interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  module_index: number
}

interface Props {
  courseId: string
  moduleIndex?: number
  open: boolean
  onClose: () => void
}

export function ChatSidebar({ courseId, moduleIndex, open, onClose }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [view, setView] = useState<'list' | 'chat'>('list')
  const bottomRef = useRef<HTMLDivElement>(null)

  const isOverview = moduleIndex === undefined

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!open) return
    setLoadingList(true)
    setView('list')
    setActiveConvId(null)
    setMessages([])

    let url = `/api/conversations?courseId=${courseId}`
    if (moduleIndex !== undefined) url += `&moduleIndex=${moduleIndex}`
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setConversations(data.conversations || [])
        setLoadingList(false)
      })
      .catch(() => setLoadingList(false))
  }, [open, courseId, moduleIndex])

  const loadConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId)
    setView('chat')
    const res = await fetch(`/api/conversations/${convId}/messages`)
    const data = await res.json()
    setMessages(data.messages || [])
  }, [])

  async function createNew() {
    if (moduleIndex === undefined) return
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, moduleIndex, title: '' }),
    })
    const { conversation } = await res.json()
    if (conversation) {
      setConversations(prev => [conversation, ...prev])
      setActiveConvId(conversation.id)
      setMessages([])
      setView('chat')
    }
  }

  async function saveMessage(role: string, content: string) {
    if (!activeConvId) return
    await fetch(`/api/conversations/${activeConvId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content }),
    })
  }

  async function updateTitle(title: string) {
    if (!activeConvId) return
    const res = await fetch(`/api/conversations/${activeConvId}/title`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (res.ok) {
      setConversations(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, title } : c
      ))
    }
  }

  async function send() {
    if (!input.trim() || streaming || !activeConvId || moduleIndex === undefined) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    await saveMessage('user', userMsg.content)

    const isFirst = messages.length === 0
    const title = isFirst ? userMsg.content.slice(0, 60) : null

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

    await saveMessage('assistant', text)

    if (title) {
      await updateTitle(title)
      setConversations(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, title: title! } : c
      ))
    }
  }

  if (!open) return null

  return (
    <div className="fixed right-0 top-0 h-full w-[480px] border-l border-border bg-background shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between px-4 h-12 border-b border-border">
        {view === 'chat' ? (
          <button
            onClick={() => { setView('list'); setActiveConvId(null); setMessages([]) }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← History
          </button>
        ) : (
          <span className="text-sm font-heading font-medium">
            {isOverview ? 'Conversations' : 'Ask about this lesson'}
          </span>
        )}
        <div className="flex items-center gap-2">
          {view === 'chat' && !isOverview && (
            <button
              onClick={createNew}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              + New
            </button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-sm">✕</button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="flex-1 overflow-y-auto p-4">
          {loadingList ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-sm text-muted-foreground">No past conversations</p>
              {!isOverview && (
                <Button onClick={createNew} size="sm">Start a new question</Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium truncate">
                    {conv.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Module {conv.module_index + 1} &middot; {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
              {!isOverview && (
                <Button onClick={createNew} variant="outline" className="w-full mt-4" size="sm">
                  New conversation
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Ask any question about the lesson content.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
                <span className={`inline-block px-3 py-2 rounded-xl max-w-xs leading-relaxed ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}>
                  {m.content || '…'}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {moduleIndex !== undefined && (
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question..."
                onKeyDown={e => e.key === 'Enter' && send()}
              />
              <Button onClick={send} disabled={streaming || !input.trim()}>Send</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
