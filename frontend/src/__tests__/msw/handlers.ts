import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

export const handlers = [
  http.get(`${BASE}/auth/me`, () => HttpResponse.json({ id: 1, email: 'admin@test.com', role: 'admin', name: 'Admin', is_active: true, created_at: '2026-01-01T00:00:00Z' })),
  http.post(`${BASE}/auth/login`, () => HttpResponse.json({ access_token: 'mock-token', token_type: 'bearer', user_id: 1, role: 'admin' })),
  http.post(`${BASE}/auth/register`, () => HttpResponse.json({ access_token: 'mock-token', token_type: 'bearer', user_id: 2, role: 'client' })),
  http.post(`${BASE}/auth/refresh`, () => HttpResponse.json({})),
  http.post(`${BASE}/auth/logout`, () => HttpResponse.json({})),

  http.get(`${BASE}/cargo/`, () => HttpResponse.json({ total: 2, items: [
    { id: 1, cargo_type: 'Grain', weight: 5000, origin: 'Aktau', destination: 'Baku', status: 'in_transit', priority_score: 1.5, is_flagged: false, ai_generated: false, client_id: 1, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 2, cargo_type: 'Oil', weight: 10000, origin: 'Aktau', destination: 'Istanbul', status: 'created', priority_score: 1.0, is_flagged: false, ai_generated: false, client_id: 1, created_at: '2026-06-02T00:00:00Z', updated_at: '2026-06-02T00:00:00Z' },
  ]})),
  http.post(`${BASE}/cargo/create`, () => HttpResponse.json({ id: 3, cargo_type: 'Steel', weight: 3000, origin: 'Aktau', destination: 'Tehran', status: 'created', priority_score: 1.0, is_flagged: false, ai_generated: false, client_id: 1, created_at: '2026-06-10T00:00:00Z', updated_at: '2026-06-10T00:00:00Z' })),
  http.patch(`${BASE}/cargo/:id/status`, () => HttpResponse.json({ id: 1, status: 'approved' })),

  http.get(`${BASE}/ship/`, () => HttpResponse.json({ total: 1, items: [{ id: 1, name: 'M/V Caspian', capacity: 15000, status: 'available', created_at: '2026-01-01T00:00:00Z' }]})),
  http.get(`${BASE}/berth/`, () => HttpResponse.json({ total: 2, items: [{ id: 1, name: 'Berth A', status: 'free', capacity: 20000, created_at: '2026-01-01T00:00:00Z' }, { id: 2, name: 'Berth B', status: 'occupied', capacity: 15000, created_at: '2026-01-01T00:00:00Z' }]})),
  http.get(`${BASE}/queue/`, () => HttpResponse.json({ total: 0, items: [] })),
  http.get(`${BASE}/notifications/`, () => HttpResponse.json({ total: 0, unread: 0, items: [] })),
  http.get(`${BASE}/analytics/dashboard`, () => HttpResponse.json({ total_cargoes: 42, total_income: 2500000, income_by_type: { cargo_fee: 1800000, berth_fee: 500000, penalty: 200000 }, occupied_berths: 3, free_berths: 5, berth_utilization_pct: 37.5, average_waiting_time_hours: 4.2, ship_utilization_pct: 78, cargoes_by_status: { created: 10, approved: 5, assigned: 8, loading: 3, in_transit: 7, arrived: 4, delivered: 3, cancelled: 2 }})),
  http.get(`${BASE}/maps/ships`, () => HttpResponse.json([{ ship_id: 1, name: 'M/V Caspian', latitude: 43.5, longitude: 52.0, status: 'in_transit', capacity: 15000 }])),
  http.get(`${BASE}/maps/berths`, () => HttpResponse.json([{ berth_id: 1, name: 'Berth A', latitude: 43.65, longitude: 52.1, status: 'free', capacity: 20000 }])),
]
