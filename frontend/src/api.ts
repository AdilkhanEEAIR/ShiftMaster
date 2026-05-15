// =========================================================
// API Client
// Полный typed wrapper над бэкендом.
// MOCK_MODE = true пока бэк не готов — все методы возвращают локальный стейт.
// Когда бэк готов — поставить MOCK_MODE = false (или через env), и всё подключится.
// =========================================================

import type {
  Branch, Department, Employee, Shift, TimeOffRequest, User,
  DashboardSummary, Role,
} from './types'

const MOCK_MODE = true // <-- переключить на false когда бэк готов
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// -------- low-level fetch wrapper --------
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('sm_token')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(msg || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// =========================================================
// MOCK STORAGE — localStorage-backed in-memory DB
// =========================================================
const MOCK_KEYS = {
  employees: 'mock_employees',
  shifts: 'mock_shifts',
  timeoff: 'mock_timeoff',
  branches: 'mock_branches',
  departments: 'mock_departments',
  user: 'mock_user',
}

function load<T>(key: string, seed: T[]): T[] {
  const raw = localStorage.getItem(key)
  if (raw) try { return JSON.parse(raw) } catch { /* fall through */ }
  localStorage.setItem(key, JSON.stringify(seed))
  return seed
}
function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}
const uid = () => Math.random().toString(36).slice(2, 10)
const delay = (ms = 220) => new Promise(r => setTimeout(r, ms))

// -------- Seed data --------
const SEED_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Бишкек — Центральный', address: 'пр. Чуй 154', city: 'Бишкек', employeeCount: 18, active: true },
  { id: 'b2', name: 'Бишкек — Восток', address: 'ул. Айни 32', city: 'Бишкек', employeeCount: 11, active: true },
  { id: 'b3', name: 'Ош — Главный', address: 'ул. Ленина 200', city: 'Ош', employeeCount: 7, active: true },
]

const SEED_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Склад', description: 'Приём и отгрузка товара', color: '#3b82f6', employeeCount: 14 },
  { id: 'd2', name: 'Кухня', description: 'Подготовка блюд', color: '#22c55e', employeeCount: 9 },
  { id: 'd3', name: 'Зал', description: 'Обслуживание гостей', color: '#f59e0b', employeeCount: 8 },
  { id: 'd4', name: 'Доставка', description: 'Курьеры', color: '#a855f7', employeeCount: 5 },
]

const SEED_EMPLOYEES: Employee[] = [
  { id: 'e1', fullName: 'Алибек Жумабаев', email: 'alibek@sm.kg', phone: '+996 555 12 34 56', position: 'Старший складовщик', departmentId: 'd1', branchId: 'b1', hireDate: '2024-08-12', status: 'ACTIVE', hourlyRate: 180, skills: ['Погрузчик', 'Учёт'] },
  { id: 'e2', fullName: 'Айгуль Орозова', email: 'aigul@sm.kg', phone: '+996 700 22 11 88', position: 'Шеф-повар', departmentId: 'd2', branchId: 'b1', hireDate: '2023-03-04', status: 'ACTIVE', hourlyRate: 320, skills: ['Plating', 'Меню-планирование'] },
  { id: 'e3', fullName: 'Тимур Касымов', email: 'timur@sm.kg', phone: '+996 559 78 90 12', position: 'Курьер', departmentId: 'd4', branchId: 'b2', hireDate: '2025-01-20', status: 'ACTIVE', hourlyRate: 140 },
  { id: 'e4', fullName: 'Назгуль Бекова', email: 'nazgul@sm.kg', phone: '+996 777 45 67 23', position: 'Официант', departmentId: 'd3', branchId: 'b1', hireDate: '2024-11-09', status: 'ON_LEAVE', hourlyRate: 130 },
  { id: 'e5', fullName: 'Бакыт Усубалиев', email: 'bakyt@sm.kg', phone: '+996 550 33 44 55', position: 'Складовщик', departmentId: 'd1', branchId: 'b3', hireDate: '2025-04-01', status: 'ACTIVE', hourlyRate: 160 },
  { id: 'e6', fullName: 'Мээрим Жалилова', email: 'meerim@sm.kg', phone: '+996 555 99 88 77', position: 'Повар', departmentId: 'd2', branchId: 'b2', hireDate: '2024-06-15', status: 'ACTIVE', hourlyRate: 200 },
]

const today = new Date()
const iso = (d: Date) => d.toISOString()
const at = (offsetDays: number, h: number, m = 0) => {
  const d = new Date(today)
  d.setDate(d.getDate() + offsetDays)
  d.setHours(h, m, 0, 0)
  return iso(d)
}
const SEED_SHIFTS: Shift[] = [
  { id: 's1', employeeId: 'e1', branchId: 'b1', departmentId: 'd1', startsAt: at(0, 9), endsAt: at(0, 17), status: 'IN_PROGRESS', volumePlanned: 500, volumeActual: 320 },
  { id: 's2', employeeId: 'e2', branchId: 'b1', departmentId: 'd2', startsAt: at(0, 11), endsAt: at(0, 22), status: 'IN_PROGRESS', volumePlanned: 80, volumeActual: 47 },
  { id: 's3', employeeId: 'e3', branchId: 'b2', departmentId: 'd4', startsAt: at(0, 14), endsAt: at(0, 22), status: 'SCHEDULED' },
  { id: 's4', employeeId: 'e5', branchId: 'b3', departmentId: 'd1', startsAt: at(1, 8), endsAt: at(1, 16), status: 'SCHEDULED', volumePlanned: 450 },
  { id: 's5', employeeId: 'e6', branchId: 'b2', departmentId: 'd2', startsAt: at(1, 10), endsAt: at(1, 20), status: 'SCHEDULED' },
  { id: 's6', employeeId: 'e1', branchId: 'b1', departmentId: 'd1', startsAt: at(-1, 9), endsAt: at(-1, 17), status: 'COMPLETED', volumePlanned: 500, volumeActual: 512 },
]

const SEED_TIMEOFF: TimeOffRequest[] = [
  { id: 't1', employeeId: 'e4', type: 'SICK', startDate: '2026-05-14', endDate: '2026-05-17', reason: 'ОРВИ', status: 'APPROVED', createdAt: '2026-05-13' },
  { id: 't2', employeeId: 'e3', type: 'VACATION', startDate: '2026-06-01', endDate: '2026-06-14', reason: 'Плановый отпуск', status: 'PENDING', createdAt: '2026-05-10' },
  { id: 't3', employeeId: 'e6', type: 'PERSONAL', startDate: '2026-05-20', endDate: '2026-05-20', reason: 'Семейные обстоятельства', status: 'PENDING', createdAt: '2026-05-15' },
  { id: 't4', employeeId: 'e2', type: 'SICK', startDate: '2026-04-22', endDate: '2026-04-23', status: 'REJECTED', createdAt: '2026-04-22' },
]

// helper: hydrate names for display
function withEmpNames<T extends { employeeId: string }>(items: T[], emps: Employee[]): (T & { employeeName: string })[] {
  return items.map(i => ({ ...i, employeeName: emps.find(e => e.id === i.employeeId)?.fullName ?? '—' }))
}

// =========================================================
// AUTH
// =========================================================
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (MOCK_MODE) {
      await delay()
      if (!email || !password) throw new Error('Введите email и пароль')
      const role: Role = email.includes('owner') ? 'OWNER' : email.includes('worker') ? 'WORKER' : 'MANAGER'
      const user: User = { id: 'u1', email, fullName: email.split('@')[0], role, branchId: 'b1' }
      const token = 'mock-token-' + uid()
      localStorage.setItem('sm_token', token)
      localStorage.setItem(MOCK_KEYS.user, JSON.stringify(user))
      return { user, token }
    }
    const r = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('sm_token', r.token)
    return r
  },

  async register(input: { email: string; password: string; fullName: string; companyName: string }): Promise<{ user: User; token: string }> {
    if (MOCK_MODE) {
      await delay()
      const user: User = { id: 'u1', email: input.email, fullName: input.fullName, role: 'OWNER', branchId: 'b1' }
      const token = 'mock-token-' + uid()
      localStorage.setItem('sm_token', token)
      localStorage.setItem(MOCK_KEYS.user, JSON.stringify(user))
      return { user, token }
    }
    const r = await request<{ user: User; token: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify(input),
    })
    localStorage.setItem('sm_token', r.token)
    return r
  },

  async me(): Promise<User | null> {
    if (MOCK_MODE) {
      const raw = localStorage.getItem(MOCK_KEYS.user)
      return raw ? JSON.parse(raw) : null
    }
    try { return await request<User>('/auth/me') } catch { return null }
  },

  logout() {
    localStorage.removeItem('sm_token')
    localStorage.removeItem(MOCK_KEYS.user)
  },
}

// =========================================================
// EMPLOYEES — CRUD #1
// =========================================================
export const employeesApi = {
  async list(): Promise<Employee[]> {
    if (MOCK_MODE) { await delay(); return load(MOCK_KEYS.employees, SEED_EMPLOYEES) }
    return request<Employee[]>('/employees')
  },
  async create(input: Omit<Employee, 'id'>): Promise<Employee> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.employees, SEED_EMPLOYEES)
      const item: Employee = { ...input, id: uid() }
      list.unshift(item); save(MOCK_KEYS.employees, list)
      return item
    }
    return request<Employee>('/employees', { method: 'POST', body: JSON.stringify(input) })
  },
  async update(id: string, patch: Partial<Employee>): Promise<Employee> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.employees, SEED_EMPLOYEES)
      const i = list.findIndex(e => e.id === id)
      if (i < 0) throw new Error('not found')
      list[i] = { ...list[i], ...patch }
      save(MOCK_KEYS.employees, list)
      return list[i]
    }
    return request<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  },
  async remove(id: string): Promise<void> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.employees, SEED_EMPLOYEES).filter(e => e.id !== id)
      save(MOCK_KEYS.employees, list)
      return
    }
    return request<void>(`/employees/${id}`, { method: 'DELETE' })
  },
}

// =========================================================
// SHIFTS — CRUD #2
// =========================================================
export const shiftsApi = {
  async list(): Promise<Shift[]> {
    if (MOCK_MODE) {
      await delay()
      const emps = load(MOCK_KEYS.employees, SEED_EMPLOYEES)
      const list = load(MOCK_KEYS.shifts, SEED_SHIFTS)
      return withEmpNames(list, emps)
    }
    return request<Shift[]>('/shifts')
  },
  async create(input: Omit<Shift, 'id'>): Promise<Shift> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.shifts, SEED_SHIFTS)
      const item: Shift = { ...input, id: uid() }
      list.unshift(item); save(MOCK_KEYS.shifts, list)
      return item
    }
    return request<Shift>('/shifts', { method: 'POST', body: JSON.stringify(input) })
  },
  async update(id: string, patch: Partial<Shift>): Promise<Shift> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.shifts, SEED_SHIFTS)
      const i = list.findIndex(s => s.id === id)
      if (i < 0) throw new Error('not found')
      list[i] = { ...list[i], ...patch }
      save(MOCK_KEYS.shifts, list)
      return list[i]
    }
    return request<Shift>(`/shifts/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  },
  async remove(id: string): Promise<void> {
    if (MOCK_MODE) {
      await delay()
      save(MOCK_KEYS.shifts, load(MOCK_KEYS.shifts, SEED_SHIFTS).filter(s => s.id !== id))
      return
    }
    return request<void>(`/shifts/${id}`, { method: 'DELETE' })
  },
}

// =========================================================
// TIME-OFF — CRUD #3
// =========================================================
export const timeOffApi = {
  async list(): Promise<TimeOffRequest[]> {
    if (MOCK_MODE) {
      await delay()
      const emps = load(MOCK_KEYS.employees, SEED_EMPLOYEES)
      const list = load(MOCK_KEYS.timeoff, SEED_TIMEOFF)
      return withEmpNames(list, emps)
    }
    return request<TimeOffRequest[]>('/time-off')
  },
  async create(input: Omit<TimeOffRequest, 'id' | 'createdAt' | 'status'>): Promise<TimeOffRequest> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.timeoff, SEED_TIMEOFF)
      const item: TimeOffRequest = { ...input, id: uid(), status: 'PENDING', createdAt: new Date().toISOString().slice(0, 10) }
      list.unshift(item); save(MOCK_KEYS.timeoff, list)
      return item
    }
    return request<TimeOffRequest>('/time-off', { method: 'POST', body: JSON.stringify(input) })
  },
  async update(id: string, patch: Partial<TimeOffRequest>): Promise<TimeOffRequest> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.timeoff, SEED_TIMEOFF)
      const i = list.findIndex(t => t.id === id)
      if (i < 0) throw new Error('not found')
      list[i] = { ...list[i], ...patch }
      save(MOCK_KEYS.timeoff, list)
      return list[i]
    }
    return request<TimeOffRequest>(`/time-off/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  },
  async remove(id: string): Promise<void> {
    if (MOCK_MODE) {
      await delay()
      save(MOCK_KEYS.timeoff, load(MOCK_KEYS.timeoff, SEED_TIMEOFF).filter(t => t.id !== id))
      return
    }
    return request<void>(`/time-off/${id}`, { method: 'DELETE' })
  },
}

// =========================================================
// BRANCHES — CRUD #4
// =========================================================
export const branchesApi = {
  async list(): Promise<Branch[]> {
    if (MOCK_MODE) { await delay(); return load(MOCK_KEYS.branches, SEED_BRANCHES) }
    return request<Branch[]>('/branches')
  },
  async create(input: Omit<Branch, 'id'>): Promise<Branch> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.branches, SEED_BRANCHES)
      const item: Branch = { ...input, id: uid() }
      list.unshift(item); save(MOCK_KEYS.branches, list)
      return item
    }
    return request<Branch>('/branches', { method: 'POST', body: JSON.stringify(input) })
  },
  async update(id: string, patch: Partial<Branch>): Promise<Branch> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.branches, SEED_BRANCHES)
      const i = list.findIndex(b => b.id === id)
      if (i < 0) throw new Error('not found')
      list[i] = { ...list[i], ...patch }
      save(MOCK_KEYS.branches, list)
      return list[i]
    }
    return request<Branch>(`/branches/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  },
  async remove(id: string): Promise<void> {
    if (MOCK_MODE) {
      await delay()
      save(MOCK_KEYS.branches, load(MOCK_KEYS.branches, SEED_BRANCHES).filter(b => b.id !== id))
      return
    }
    return request<void>(`/branches/${id}`, { method: 'DELETE' })
  },
}

// =========================================================
// DEPARTMENTS — CRUD #5
// =========================================================
export const departmentsApi = {
  async list(): Promise<Department[]> {
    if (MOCK_MODE) { await delay(); return load(MOCK_KEYS.departments, SEED_DEPARTMENTS) }
    return request<Department[]>('/departments')
  },
  async create(input: Omit<Department, 'id'>): Promise<Department> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.departments, SEED_DEPARTMENTS)
      const item: Department = { ...input, id: uid() }
      list.unshift(item); save(MOCK_KEYS.departments, list)
      return item
    }
    return request<Department>('/departments', { method: 'POST', body: JSON.stringify(input) })
  },
  async update(id: string, patch: Partial<Department>): Promise<Department> {
    if (MOCK_MODE) {
      await delay()
      const list = load(MOCK_KEYS.departments, SEED_DEPARTMENTS)
      const i = list.findIndex(d => d.id === id)
      if (i < 0) throw new Error('not found')
      list[i] = { ...list[i], ...patch }
      save(MOCK_KEYS.departments, list)
      return list[i]
    }
    return request<Department>(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  },
  async remove(id: string): Promise<void> {
    if (MOCK_MODE) {
      await delay()
      save(MOCK_KEYS.departments, load(MOCK_KEYS.departments, SEED_DEPARTMENTS).filter(d => d.id !== id))
      return
    }
    return request<void>(`/departments/${id}`, { method: 'DELETE' })
  },
}

// =========================================================
// DASHBOARD
// =========================================================
export const dashboardApi = {
  async summary(): Promise<DashboardSummary> {
    if (MOCK_MODE) {
      await delay()
      const emps = load(MOCK_KEYS.employees, SEED_EMPLOYEES)
      const shifts = load(MOCK_KEYS.shifts, SEED_SHIFTS)
      const timeoff = load(MOCK_KEYS.timeoff, SEED_TIMEOFF)
      const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
      return {
        totalEmployees: emps.length,
        activeShiftsNow: shifts.filter(s => s.status === 'IN_PROGRESS').length,
        pendingTimeOff: timeoff.filter(t => t.status === 'PENDING').length,
        monthlyPayroll: 1_280_400,
        attendanceRate: 94.2,
        trend: days.map((d, i) => ({ day: d, shifts: 8 + Math.round(Math.sin(i) * 4 + i) })),
      }
    }
    return request<DashboardSummary>('/dashboard/summary')
  },
}

// =========================================================
// AI Schedule
// =========================================================
export const aiApi = {
  async generateSchedule(prompt: string): Promise<{ id: string; shifts: Shift[]; explanation: string }> {
    if (MOCK_MODE) {
      await delay(900)
      const emps = load<Employee>(MOCK_KEYS.employees, SEED_EMPLOYEES)
      const generated: Shift[] = emps.slice(0, 5).map((e, i) => ({
        id: 'g' + uid(),
        employeeId: e.id,
        employeeName: e.fullName,
        branchId: e.branchId,
        departmentId: e.departmentId,
        startsAt: at(i + 1, 9),
        endsAt: at(i + 1, 17),
        status: 'SCHEDULED',
      }))
      return {
        id: uid(),
        shifts: generated,
        explanation: `Сгенерировано ${generated.length} смен на основе твоего запроса: «${prompt}». Учтены лимит 8 часов, 2 выходных в неделю и баланс нагрузки.`,
      }
    }
    return request<{ id: string; shifts: Shift[]; explanation: string }>('/ai/schedule', {
      method: 'POST', body: JSON.stringify({ prompt }),
    })
  },
}