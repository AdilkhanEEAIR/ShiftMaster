// =========================================================
// Domain types
// =========================================================

export type Role = 'OWNER' | 'MANAGER' | 'WORKER'

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  branchId?: string
  avatarUrl?: string
  phone?: string
}

export interface Employee {
  id: string
  fullName: string
  email: string
  phone: string
  position: string
  departmentId: string
  branchId: string
  hireDate: string // ISO date
  status: 'ACTIVE' | 'ON_LEAVE' | 'ARCHIVED'
  hourlyRate?: number
  skills?: string[]
}

export type ShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface Shift {
  id: string
  employeeId: string
  employeeName?: string
  branchId: string
  departmentId: string
  startsAt: string // ISO
  endsAt: string // ISO
  status: ShiftStatus
  volumePlanned?: number
  volumeActual?: number
  notes?: string
}

export type TimeOffType = 'SICK' | 'VACATION' | 'PERSONAL' | 'UNPAID'
export type TimeOffStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface TimeOffRequest {
  id: string
  employeeId: string
  employeeName?: string
  type: TimeOffType
  startDate: string
  endDate: string
  reason?: string
  status: TimeOffStatus
  createdAt: string
}

export interface Branch {
  id: string
  name: string
  address: string
  city: string
  managerId?: string
  employeeCount?: number
  active: boolean
}

export interface Department {
  id: string
  name: string
  description?: string
  headEmployeeId?: string
  color?: string
  employeeCount?: number
}

export interface DashboardSummary {
  totalEmployees: number
  activeShiftsNow: number
  pendingTimeOff: number
  monthlyPayroll: number
  attendanceRate: number
  trend: { day: string; shifts: number }[]
}