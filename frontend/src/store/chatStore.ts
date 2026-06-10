import { create } from 'zustand'
import type { ChatMessage } from '@/types'

interface ChatState {
  messagesByDeal: Record<number, ChatMessage[]>
  messagesByUser: Record<string, ChatMessage[]>
  conversations: { userId: number; name: string; role: string; lastMessage?: string; unread: number }[]
  addMessage: (msg: ChatMessage) => void
  getDealMessages: (dealId: number) => ChatMessage[]
  getUserMessages: (userId: number) => ChatMessage[]
  markRead: (dealId?: number, userId?: number) => void
}

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(`chat_${key}`)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(`chat_${key}`, JSON.stringify(value)) } catch { /* noop */ }
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByDeal: load('byDeal', {}),
  messagesByUser: load('byUser', {}),
  conversations: load('conversations', []),

  addMessage: (msg) => {
    const { messagesByDeal, messagesByUser, conversations } = get()

    if (msg.dealId) {
      const dealMsgs = [...(messagesByDeal[msg.dealId] || []), msg]
      const newByDeal = { ...messagesByDeal, [msg.dealId]: dealMsgs }
      set({ messagesByDeal: newByDeal })
      save('byDeal', newByDeal)
    }

    const userKey = [msg.fromUserId, msg.toUserId].sort().join('-')
    const userMsgs = [...(messagesByUser[userKey] || []), msg]
    const newByUser = { ...messagesByUser, [userKey]: userMsgs }
    set({ messagesByUser: newByUser })
    save('byUser', newByUser)

    const otherId = msg.fromUserId === msg.toUserId ? msg.fromUserId : msg.fromUserId
    const convIdx = conversations.findIndex(
      (c) => c.userId === otherId || c.userId === msg.fromUserId || c.userId === msg.toUserId
    )
    if (convIdx >= 0) {
      const updated = [...conversations]
      updated[convIdx] = { ...updated[convIdx], lastMessage: msg.text, unread: updated[convIdx].unread + 1 }
      set({ conversations: updated })
      save('conversations', updated)
    }
  },

  getDealMessages: (dealId) => get().messagesByDeal[dealId] || [],
  getUserMessages: (userId) => {
    const key = [userId, userId].sort().join('-')
    return get().messagesByUser[key] || []
  },

  markRead: (dealId, userId) => {
    const { conversations } = get()
    if (dealId) {
      // find conversation by deal
    }
    if (userId) {
      const updated = conversations.map((c) =>
        c.userId === userId ? { ...c, unread: 0 } : c
      )
      set({ conversations: updated })
      save('conversations', updated)
    }
  },
}))
