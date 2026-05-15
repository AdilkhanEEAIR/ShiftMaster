import { useEffect, useState } from 'react'
import { Users, Calendar, FileText, Wallet, TrendingUp, ArrowUpRight } from 'lucide-react'
import { Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts'
import { dashboardApi, shiftsApi } from '../../api'
import type { DashboardSummary, Shift } from '../../types'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])

  useEffect(() => {
    dashboardApi.summary().then(setSummary)
    shiftsApi.list().then(setShifts)
  }, [])

  if (!summary) {
    return <div className="empty"><div className="spinner" /></div>
  }

  const active = shifts.filter(s => s.status === 'IN_PROGRESS')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats */}
      <div className="stat-grid">
        <Stat icon={<Users size={16} />} label="Всего сотрудников" value={String(summary.totalEmployees)} delta="+3 за месяц" />
        <Stat icon={<Calendar size={16} />} label="Активных смен сейчас" value={String(summary.activeShiftsNow)} delta={<span className="text-success">↑ выше среднего</span>} />
        <Stat icon={<FileText size={16} />} label="Заявок на отгул" value={String(summary.pendingTimeOff)} delta="ожидают решения" />
        <Stat icon={<Wallet size={16} />} label="ФОТ за месяц" value={`${(summary.monthlyPayroll / 1000).toFixed(0)}K сом`} delta={<span className="text-success">−2.4% к плану</span>} />
      </div>

      {/* Chart + Live */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: 16 }}>Смены за неделю</h3>
              <p className="text-muted text-xs" style={{ marginTop: 2 }}>Распределение нагрузки по дням</p>
            </div>
            <Link to="/app/reports" className="btn btn-ghost btn-sm">
              Все отчёты <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#5b6479" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#5b6479" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: '#3b82f6', strokeDasharray: '3 3' }}
                  contentStyle={{
                    background: '#11162a',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Area type="monotone" dataKey="shifts" stroke="#60a5fa" strokeWidth={2} fill="url(#gradBlue)" />
                <Line type="monotone" dataKey="shifts" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: '#60a5fa' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: 16 }}>Live — кто сейчас работает</h3>
              <p className="text-muted text-xs" style={{ marginTop: 2 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 99, background: 'var(--success)', marginRight: 6, animation: 'pulse 1.4s infinite' }} />
                Обновлено только что
              </p>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {active.length === 0 ? (
              <div className="empty">Никого нет на смене</div>
            ) : (
              active.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 22px',
                  borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div className="avatar">{s.employeeName?.[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{s.employeeName}</div>
                    <div className="text-xs text-muted mono">
                      {new Date(s.startsAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      {' — '}
                      {new Date(s.endsAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="badge badge-success"><span className="badge-dot" />на смене</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="card" style={{ padding: 22, background: 'linear-gradient(135deg, var(--accent-soft), transparent)', borderColor: 'var(--accent-border)' }}>
        <div className="flex items-center gap-4">
          <div className="feature-icon" style={{ margin: 0 }}>
            <TrendingUp size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="fw-600">Попробуйте AI Schedule Optimizer</div>
            <div className="text-secondary text-sm" style={{ marginTop: 2 }}>
              Опишите правила расписания текстом — алгоритм построит план за секунды.
            </div>
          </div>
          <Link to="/app/schedule" className="btn btn-primary btn-sm">Открыть</Link>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string; delta: React.ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-label">{icon} {label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-delta text-muted">{delta}</div>
    </div>
  )
}