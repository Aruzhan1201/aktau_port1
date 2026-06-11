import { create } from 'zustand'
import type { Deal, DealStatus } from '@/types'

interface DealState {
  deals: Deal[]
  createDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'initiatorPhoneRevealed' | 'targetPhoneRevealed'>) => Deal
  updateDealStatus: (dealId: number, status: DealStatus) => void
  approvePhoneReveal: (dealId: number, userId: number) => void
  getDealsForUser: (userId: number) => Deal[]
  getDeal: (dealId: number) => Deal | undefined
}

function loadDeals(): Deal[] {
  try {
    const v = localStorage.getItem('deals')
    return v ? JSON.parse(v) : []
  } catch { return [] }
}

function saveDeals(deals: Deal[]) {
  try { localStorage.setItem('deals', JSON.stringify(deals)) } catch { /* noop */ }
}

let dealCounter = 0

const tariffPlans: Record<string, { name: string; description: string; pricePerHour: number; features: string[] }> = {
  economy: {
    name: 'Economy',
    description: 'Basic berth access',
    pricePerHour: 50,
    features: ['Standard mooring', 'Basic utilities', '24/7 security'],
  },
  standard: {
    name: 'Standard',
    description: 'Full service berth',
    pricePerHour: 120,
    features: ['Priority mooring', 'Water & electricity', 'Waste disposal', '24/7 security', 'Crane access'],
  },
  premium: {
    name: 'Premium',
    description: 'VIP berth with concierge',
    pricePerHour: 300,
    features: ['Guaranteed berth', 'All utilities', 'Catering service', 'Crane & forklift', 'Concierge service', 'Secure storage'],
  },
}

export { tariffPlans }

export const useDealStore = create<DealState>((set, get) => ({
  deals: loadDeals(),

  createDeal: (data) => {
    dealCounter += 1
    const deal: Deal = {
      ...data,
      id: dealCounter,
      initiatorPhoneRevealed: false,
      targetPhoneRevealed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const deals = [...get().deals, deal]
    set({ deals })
    saveDeals(deals)
    return deal
  },

  updateDealStatus: (dealId, status) => {
    const deals = get().deals.map((d) =>
      d.id === dealId ? { ...d, status, updatedAt: new Date().toISOString() } : d
    )
    set({ deals })
    saveDeals(deals)
  },

  approvePhoneReveal: (dealId, userId) => {
    const deals = get().deals.map((d) => {
      if (d.id !== dealId) return d
      if (d.initiatorId === userId) return { ...d, initiatorPhoneRevealed: true, updatedAt: new Date().toISOString() }
      if (d.targetId === userId) return { ...d, targetPhoneRevealed: true, updatedAt: new Date().toISOString() }
      return d
    })
    set({ deals })
    saveDeals(deals)
  },

  getDealsForUser: (userId) => get().deals.filter((d) => d.initiatorId === userId || d.targetId === userId),
  getDeal: (dealId) => get().deals.find((d) => d.id === dealId),
}))
