import { useState, useRef, useEffect } from 'react'
import { useRoutePlanner } from '@/hooks/useRoutePlanner'
import { MessageCircle, Send, Bot, User, Loader2 } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'bot'
  text: string
}

export function RouteChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: 'Hi! I can help you plan delivery routes in the Mangistau region and Caspian Sea. Where do you need to deliver cargo?' },
  ])
  const [input, setInput] = useState('')
  const planner = useRoutePlanner()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const q = input.trim()
    if (!q || planner.isPending) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: q }])
    planner.mutate(q, {
      onSuccess: (data) => {
        setMessages((prev) => [...prev, { role: 'bot', text: data.answer }])
      },
      onError: () => {
        setMessages((prev) => [...prev, { role: 'bot', text: 'Sorry, I couldn\'t process that. Try asking about routes between Aktau, Baku, Kuryk, or Turkmenbashi!' }])
      },
    })
  }

  return (
    <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 shadow-sm flex flex-col" style={{ maxHeight: 400 }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-silk-gold/20 shrink-0">
        <MessageCircle className="w-4 h-4 text-silk-gold-dark" />
        <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Route Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" style={{ minHeight: 200 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'bot' && <Bot className="w-5 h-5 text-silk-gold-dark mt-1 shrink-0" />}
            <div className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm ${
              m.role === 'user'
                ? 'bg-kazakh-burgundy text-heritage-cream rounded-br-sm'
                : 'bg-heritage-cream dark:bg-kazakh-burgundy-dark text-modern-slate dark:text-warm-sand rounded-bl-sm'
            }`}>
              {m.text}
            </div>
            {m.role === 'user' && <User className="w-5 h-5 text-modern-slate dark:text-warm-sand mt-1 shrink-0" />}
          </div>
        ))}
        {planner.isPending && (
          <div className="flex gap-2">
            <Bot className="w-5 h-5 text-silk-gold-dark mt-1 shrink-0" />
            <div className="bg-heritage-cream dark:bg-kazakh-burgundy-dark text-modern-slate dark:text-warm-sand rounded-xl rounded-bl-sm px-3.5 py-2 text-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-5 py-3 border-t border-silk-gold/20 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about routes..."
          className="flex-1 border border-silk-gold/40 rounded-lg px-3 py-2 text-sm outline-none bg-heritage-cream dark:bg-kazakh-burgundy-dark text-kazakh-burgundy dark:text-heritage-cream placeholder:text-modern-slate dark:placeholder:text-warm-sand/50 focus:border-silk-gold focus:ring-1 focus:ring-silk-gold/30 transition-colors"
          disabled={planner.isPending}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || planner.isPending}
          className="shrink-0 w-9 h-9 flex items-center justify-center bg-kazakh-burgundy text-heritage-cream rounded-lg hover:bg-kazakh-burgundy-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
