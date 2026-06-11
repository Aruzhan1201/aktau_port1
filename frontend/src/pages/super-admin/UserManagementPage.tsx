import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { useAdminUsers, useCreateUser, useDeleteUser } from '@/hooks/useAdmin'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Trash2, Search } from 'lucide-react'

const roleColors: Record<string, string> = {
  client: 'bg-blue-100 text-blue-700',
  driver: 'bg-purple-100 text-purple-700',
  captain: 'bg-cyan-100 text-cyan-700',
  parking_manager: 'bg-amber-100 text-amber-700',
  port_manager: 'bg-green-100 text-green-700',
  governance: 'bg-green-100 text-green-700',
  admin: 'bg-slate-100 text-slate-700',
  super_admin: 'bg-red-100 text-red-700',
}

export function UserManagementPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client', phone: '' })
  const { data: users, isLoading } = useAdminUsers(roleFilter ? { role: roleFilter, search: search || undefined } : { search: search || undefined })
  const createUser = useCreateUser()
  const deleteUser = useDeleteUser()

  const handleCreate = () => {
    createUser.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ name: '', email: '', password: '', role: 'client', phone: '' }) } })
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="User Management" description="Manage all platform users">
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </PageHeader>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Roles</option>
          {['client', 'driver', 'captain', 'parking_manager', 'port_manager', 'governance', 'admin', 'super_admin'].map(r => (
            <option key={r} value={r}>{r.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="text-left p-3 font-medium text-slate-600">Name</th><th className="text-left p-3 font-medium text-slate-600">Email</th><th className="text-left p-3 font-medium text-slate-600">Role</th><th className="text-left p-3 font-medium text-slate-600">Phone</th><th className="text-left p-3 font-medium text-slate-600">Active</th><th className="p-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{u.name}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3"><Badge className={roleColors[u.role] || ''}>{u.role}</Badge></td>
                  <td className="p-3 text-slate-600">{u.phone || '-'}</td>
                  <td className="p-3"><span className={`inline-block w-2 h-2 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} /></td>
                  <td className="p-3">
                    <button onClick={() => { if (confirm('Delete user?')) deleteUser.mutate(u.id) }}
                      className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Create User</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {['client', 'driver', 'captain', 'parking_manager', 'port_manager', 'governance', 'admin', 'super_admin'].map(r => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </select>
              <button onClick={handleCreate} disabled={!form.name || !form.email || !form.password}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
