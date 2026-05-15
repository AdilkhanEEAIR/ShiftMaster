import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, FileText, Building2, Tags,
  Sparkles, BarChart3, Settings, LogOut, Bell, Search,
} from 'lucide-react'
import { useAuth } from '../auth'
import Logo from './Logo'

const NAV_MAIN = [
  { to: '/app', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/app/schedule', label: 'AI Расписание', icon: Sparkles, badge: 'NEW' },
  { to: '/app/shifts', label: 'Смены', icon: Calendar },
  { to: '/app/employees', label: 'Сотрудники', icon: Users },
  { to: '/app/time-off', label: 'Заявки на отгул', icon: FileText },
]
const NAV_ORG = [
  { to: '/app/branches', label: 'Филиалы', icon: Building2 },
  { to: '/app/departments', label: 'Отделы', icon: Tags },
  { to: '/app/reports', label: 'Аналитика', icon: BarChart3 },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
]

const TITLES: Record<string, { title: string; sub: string }> = {
  '/app':            { title: 'Обзор',         sub: 'Что происходит прямо сейчас' },
  '/app/employees':  { title: 'Сотрудники',    sub: 'Управление командой' },
  '/app/shifts':     { title: 'Смены',         sub: 'Расписание и текущий статус' },
  '/app/time-off':   { title: 'Заявки на отгул', sub: 'Больничные, отпуска и прочие отсутствия' },
  '/app/branches':   { title: 'Филиалы',       sub: 'Все точки вашего бизнеса' },
  '/app/departments':{ title: 'Отделы',        sub: 'Структура команды' },
  '/app/schedule':   { title: 'AI Schedule Optimizer', sub: 'Опишите правила — мы построим расписание' },
  '/app/reports':    { title: 'Аналитика',     sub: 'Производительность и ФОТ' },
  '/app/settings':   { title: 'Настройки',     sub: 'Профиль и компания' },
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const meta = TITLES[loc.pathname] ?? { title: '', sub: '' }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Logo />
          <span>ShiftMaster</span>
        </div>

        <div className="sidebar-section">Основное</div>
        <nav className="sidebar-nav">
          {NAV_MAIN.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <item.icon />
              <span>{item.label}</span>
              {item.badge && (
                <span className="badge badge-accent" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: 10 }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-section">Организация</div>
        <nav className="sidebar-nav">
          {NAV_ORG.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user?.fullName?.[0]?.toUpperCase() ?? '?'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName ?? 'Гость'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {user?.role === 'OWNER' ? 'Владелец' : user?.role === 'MANAGER' ? 'Менеджер' : 'Сотрудник'}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { logout(); nav('/login') }}
              aria-label="Выйти"
              title="Выйти"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main">
        <header className="app-topbar">
          <div>
            <div className="page-title">{meta.title}</div>
            <div className="page-subtitle">{meta.sub}</div>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
              <input
                className="input"
                placeholder="Поиск..."
                style={{ paddingLeft: 36, width: 240, height: 36 }}
              />
            </div>
            <button className="btn btn-secondary btn-sm" aria-label="Уведомления">
              <Bell size={15} />
            </button>
          </div>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}