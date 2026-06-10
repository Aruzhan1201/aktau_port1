import apiClient from './client'
import type { TokenResponse, RegisterRequest, LoginRequest, User } from '@/types'

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<User>('/auth/register', data),
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>('/auth/login', data),
  me: () =>
    apiClient.get<User>('/auth/me'),
  logout: () =>
    apiClient.post('/auth/logout'),
}
