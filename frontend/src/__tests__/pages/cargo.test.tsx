import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CargoListPage } from '@/pages/cargo/CargoListPage'

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('CargoListPage', () => {
  it('renders cargo page title', () => {
    renderWithProviders(<CargoListPage />)
    expect(screen.getByText('Cargo')).toBeInTheDocument()
  })
})
