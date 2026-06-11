import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useWsStore } from '@/store/wsStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageCircle } from 'lucide-react'
import type { ChatMessage, Deal } from '@/types'

interface Contact {
  userId: number
  name: string
  role: string
  lastMessage?: string
  unread: number
}

export function ChatPage() {
  const user = useAuthStore((s) => s.user)
  const messagesByUser = useChatStore((s) => s.messagesByUser)
  const addMessage = useChatStore((s) => s.addMessage)
  const markRead = useChatStore((s) => s.markRead)
  const wsSend = useWsStore((s) => s.send)
  const wsStatus = useWsStore((s) => s.status)

  const { data: dealsData } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/deals').then((r) => r.data),
  })

  const deals: Deal[] = dealsData?.items ?? []
  const contactsFromDeals = useMemo(() => {
    const seen = new Set<number>()
    const result: Contact[] = [{ userId: 1, name: 'System Admin', role: 'admin', unread: 0 }]
    deals.forEach((d) => {
      const mapId = (id: number, label: string, role: string) => {
        if (id !== user?.id && !seen.has(id)) {
          seen.add(id)
          result.push({ userId: id, name: label, role, unread: 0 })
        }
      }
      if (d.client_id && d.client_id !== user?.id) mapId(d.client_id, `Client #${d.client_id}`, 'client')
      if (d.driver_id && d.driver_id !== user?.id) mapId(d.driver_id, `Driver #${d.driver_id}`, 'driver')
      if (d.captain_id && d.captain_id !== user?.id) mapId(d.captain_id, `Captain #${d.captain_id}`, 'captain')
    })
    return result
  }, [deals, user?.id])

  const contacts = contactsFromDeals

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
      <PageHeader title="Messages" description="Chat with port staff and partners" />
      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
        <div className="w-64 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacts</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">No contacts yet</div>
            ) : (
              contacts.map((c) => {
                const isActive = activeContact?.userId === c.userId
                const msgs = getMessages(c.userId)
                const lastMsg = msgs[msgs.length - 1]
                return (
                  <button
                    key={c.userId}
                    onClick={() => { setActiveContact(c); markRead(undefined, c.userId) }}
                    className={`w-full text-left p-3 border-b border-slate-50 transition-colors ${
                      isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{c.role.replace('_', ' ')}</p>
                    {lastMsg && (
                      <p className="text-xs text-slate-400 truncate mt-1">{lastMsg.text}</p>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          {activeContact ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{activeContact.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{activeContact.role.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMessages.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">No messages yet. Say hello!</p>
                )}
                {activeMessages.map((msg) => {
                  const isMine = msg.fromUserId === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                        isMine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.status === 'sending' && ' · Sending'}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                  />
                  <Button onClick={handleSend} disabled={!text.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Select a contact to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
