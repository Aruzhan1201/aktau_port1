import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useWsStore } from '@/store/wsStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageCircle, Phone, User, Ship } from 'lucide-react'
import type { ChatMessage } from '@/types'

interface Contact {
  userId: number
  name: string
  role: string
  lastMessage?: string
  unread: number
  phone?: string
}

export function ChatPage() {
  const user = useAuthStore((s) => s.user)
  const messagesByUser = useChatStore((s) => s.messagesByUser)
  const addMessage = useChatStore((s) => s.addMessage)
  const markRead = useChatStore((s) => s.markRead)
  const wsSend = useWsStore((s) => s.send)
  const wsStatus = useWsStore((s) => s.status)

  const [contacts] = useState<Contact[]>([
    { userId: 999, name: 'Port Management', role: 'parking_manager', unread: 0 },
    { userId: 1, name: 'System Admin', role: 'admin', unread: 0 },
  ])
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const getMessages = (userId: number) => {
    const key = [user?.id ?? 0, userId].sort().join('-')
    return messagesByUser[key] || []
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeContact, messagesByUser])

  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent).detail
      if (data.type === 'chat_message') {
        addMessage({
          id: `ws-${Date.now()}`,
          fromUserId: data.from_user_id,
          toUserId: user?.id ?? 0,
          text: data.text,
          timestamp: data.timestamp || new Date().toISOString(),
          status: 'delivered',
          dealId: data.deal_id,
        })
      }
    }
    window.addEventListener('ws-message', handler)
    return () => window.removeEventListener('ws-message', handler)
  }, [user, addMessage])

  const handleSend = async () => {
    if (!text.trim() || !activeContact || !user) return
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      fromUserId: user.id,
      toUserId: activeContact.userId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending',
    }
    addMessage(msg)
    setText('')

    if (wsStatus === 'connected') {
      try {
        await wsSend({
          type: 'chat_message',
          to_user_id: activeContact.userId,
          text: msg.text,
          timestamp: msg.timestamp,
        })
        addMessage({ ...msg, status: 'delivered' })
      } catch {
        addMessage({ ...msg, status: 'sent' })
      }
    } else {
      addMessage({ ...msg, status: 'sent' })
    }
  }

  const activeMessages = activeContact ? getMessages(activeContact.userId) : []

  return (
    <div className="animate-fade-in">
      <PageHeader title="Messages" description="Chat with port management and clients" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Contacts sidebar */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversations</h3>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto">
            {contacts.map((c) => (
              <button
                key={c.userId}
                onClick={() => { setActiveContact(c); markRead(undefined, c.userId) }}
                className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${
                  activeContact?.userId === c.userId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                    c.role === 'parking_manager' ? 'bg-amber-500' :
                    c.role === 'admin' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{c.role.replace('_', ' ')}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
          {activeContact ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                  activeContact.role === 'parking_manager' ? 'bg-amber-500' :
                  activeContact.role === 'admin' ? 'bg-blue-500' : 'bg-emerald-500'
                }`}>
                  {activeContact.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{activeContact.name}</p>
                  <p className="text-xs text-slate-400">{wsStatus === 'connected' ? 'Online' : 'Offline'}</p>
                </div>
                {activeContact.phone && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="w-3 h-3" />
                    {activeContact.phone}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No messages yet</p>
                    <p className="text-xs text-slate-300">Send a message to start the conversation</p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isMine = msg.fromUserId === user?.id
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-900 rounded-bl-md'
                        }`}>
                          <p className="leading-relaxed">{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMine && (
                              <span className="ml-1">
                                {msg.status === 'sending' ? '○' : msg.status === 'sent' ? '✓' : '✓✓'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={!text.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">Select a conversation</p>
              <p className="text-xs text-slate-400 mt-1">Choose a contact from the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
