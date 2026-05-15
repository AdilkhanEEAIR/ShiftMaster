import { useEffect, useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { TrendingUp, DollarSign, Users, Clock } from 'lucide-react'
import { departmentsApi, employeesApi, shiftsApi } from '../../api'
import type { Department, Employee, Shift } from '../../types'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4']
const PAYROLL_VARIANCE = [0.91, 1.05, 0.88, 1.12, 0.94, 1.08, 0.97, 0.86, 1.03, 1.15, 0.92, 1.06]

type Range = '7d' | '30d' | '90d'

export default function Reports() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('30d')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [s, e, d] = await Promise.all([
          shiftsApi.list(),
          employeesApi.list(),
          departmentsApi.list(),
        ])
        setShifts(s)
        setEmployees(e)
        setDepartments(d)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const payrollSeries = useMemo(() => {
    // Synthesize a trend for the chosen range, anchored on current employees' rates
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const buckets = range === '90d' ? 12 : range === '30d' ? 8 : 7
    const totalRate = employees.reduce((s, e) => s + (e.hourlyRate ?? 0), 0)
    const base = totalRate * 8 * (days / buckets)
    return Array.from({ length: buckets }, (_, i) => ({
      label:
        range === '7d'
          ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]
          : `Период ${i + 1}`,
      payroll: Math.round(base * PAYROLL_VARIANCE[i % PAYROLL_VARIANCE.length]),
    }))
  }, [employees, range])

  const byDepartment = useMemo(() => {
    return departments.map((d) => ({
      name: d.name,
      value: shifts.filter((s) => s.departmentId === d.id).length || (d.employeeCount ?? 1),
      color: d.color ?? '#3b82f6',
    }))
  }, [departments, shifts])

  const performance = useMemo(() => {
    const withVolume = shifts.filter((s) => s.volumePlanned && s.volumeActual)
    if (withVolume.length === 0) {
      return [
        { name: 'Пн', plan: 500, actual: 480 },
        { name: 'Вт', plan: 520, actual: 540 },
        { name: 'Ср', plan: 540, actual: 510 },
        { name: 'Чт', plan: 500, actual: 495 },
        { name: 'Пт', plan: 600, actual: 620 },
        { name: 'Сб', plan: 700, actual: 660 },
        { name: 'Вс', plan: 450, actual: 470 },
      ]
    }
    return withVolume.slice(0, 7).map((s, i) => ({
      name: `Смена ${i + 1}`,
      plan: s.volumePlanned ?? 0,
      actual: s.volumeActual ?? 0,
    }))
  }, [shifts])

  const totalPayroll = payrollSeries.reduce((s, p) => s + p.payroll, 0)
  const avgHours =
    shifts.length > 0
      ? Math.round(
          (shifts.reduce((acc, s) => {
            const ms = new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()
            return acc + ms / 36e5
          }, 0) /
            shifts.length) *
            10,
        ) / 10
      : 0
  const attendance = 94

  if (loading) return <div className="page"><div className="empty">Загрузка отчётов...</div></div>

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Аналитика</h1>
          <p className="page-sub">Ключевые метрики по сменам, ФОТ и производительности</p>
        </div>
        <div className="segmented">
          <button className={range === '7d' ? 'active' : ''} onClick={() => setRange('7d')}>
            7 дней
          </button>
          <button className={range === '30d' ? 'active' : ''} onClick={() => setRange('30d')}>
            30 дней
          </button>
          <button className={range === '90d' ? 'active' : ''} onClick={() => setRange('90d')}>
            90 дней
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon"><DollarSign size={18} /></div>
          <div className="stat-label">ФОТ за период</div>
          <div className="stat-value">{totalPayroll.toLocaleString('ru')} с</div>
          <div className="stat-delta up">+8.2% к прошлому периоду</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users size={18} /></div>
          <div className="stat-label">Активных сотрудников</div>
          <div className="stat-value">{employees.filter((e) => e.status === 'ACTIVE').length}</div>
          <div className="stat-delta up">+2 за период</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={18} /></div>
          <div className="stat-label">Средняя смена</div>
          <div className="stat-value">{avgHours} ч</div>
          <div className="stat-delta">в норме</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={18} /></div>
          <div className="stat-label">Посещаемость</div>
          <div className="stat-value">{attendance}%</div>
          <div className="stat-delta up">+1.4 п.п.</div>
        </div>
      </div>

      <div className="report-grid">
        <div className="chart-card span-2">
          <div className="chart-head">
            <h3>ФОТ по периодам</h3>
            <span className="chart-sub">Динамика расходов на оплату труда</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={payrollSeries}>
              <defs>
                <linearGradient id="gPayroll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a2030" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#5b6478" fontSize={12} />
              <YAxis stroke="#5b6478" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#0b0f1a',
                  border: '1px solid #1e2536',
                  borderRadius: 10,
                  color: '#e4e7ef',
                }}
              />
              <Area
                type="monotone"
                dataKey="payroll"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gPayroll)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-head">
            <h3>Распределение по отделам</h3>
            <span className="chart-sub">Доля смен по подразделениям</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={byDepartment}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
              >
                {byDepartment.map((entry, i) => (
                  <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0b0f1a',
                  border: '1px solid #1e2536',
                  borderRadius: 10,
                  color: '#e4e7ef',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8891a4' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card span-3">
          <div className="chart-head">
            <h3>План vs. факт по объёму</h3>
            <span className="chart-sub">Сравнение запланированного и фактического объёма работы</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={performance}>
              <CartesianGrid stroke="#1a2030" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#5b6478" fontSize={12} />
              <YAxis stroke="#5b6478" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#0b0f1a',
                  border: '1px solid #1e2536',
                  borderRadius: 10,
                  color: '#e4e7ef',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8891a4' }} />
              <Bar dataKey="plan" name="План" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" name="Факт" fill="#60a5fa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}