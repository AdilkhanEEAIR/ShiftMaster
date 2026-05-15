import { useState } from 'react'
import { Save, Building2, User, Bell, Shield } from 'lucide-react'
import { useAuth } from '../../auth'

type Tab = 'profile' | 'company' | 'notifications' | 'security'

export default function Settings() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('profile')

  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: '+996 700 00 00 00',
    position: 'Менеджер смены',
  })

  const [company, setCompany] = useState({
    name: 'Моя компания',
    industry: 'Ресторан',
    timezone: 'Asia/Bishkek',
    workWeek: '5/2',
    maxHoursPerWeek: 40,
  })

  const [notifications, setNotifications] = useState({
    emailShifts: true,
    emailTimeOff: true,
    pushShifts: true,
    pushTimeOff: false,
    digestWeekly: true,
  })

  const [security, setSecurity] = useState({
    twoFactor: true,
    sessionTimeout: 60,
    currentPassword: '',
    newPassword: '',
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Настройки</h1>
          <p className="page-sub">Профиль, компания, уведомления и безопасность</p>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          <button
            className={tab === 'profile' ? 'active' : ''}
            onClick={() => setTab('profile')}
          >
            <User size={16} /> Профиль
          </button>
          <button
            className={tab === 'company' ? 'active' : ''}
            onClick={() => setTab('company')}
          >
            <Building2 size={16} /> Компания
          </button>
          <button
            className={tab === 'notifications' ? 'active' : ''}
            onClick={() => setTab('notifications')}
          >
            <Bell size={16} /> Уведомления
          </button>
          <button
            className={tab === 'security' ? 'active' : ''}
            onClick={() => setTab('security')}
          >
            <Shield size={16} /> Безопасность
          </button>
        </nav>

        <div className="settings-panel">
          {tab === 'profile' && (
            <form className="form" onSubmit={onSave}>
              <h2 className="settings-section-title">Профиль</h2>
              <p className="settings-section-sub">
                Эти данные видят сотрудники в вашей команде
              </p>
              <div className="form-row">
                <div className="field">
                  <label>Полное имя</label>
                  <input
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Должность</label>
                  <input
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Телефон</label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions end">
                {saved && <span className="save-hint">Сохранено</span>}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          )}

          {tab === 'company' && (
            <form className="form" onSubmit={onSave}>
              <h2 className="settings-section-title">Компания</h2>
              <p className="settings-section-sub">Глобальные настройки рабочего режима</p>
              <div className="form-row">
                <div className="field">
                  <label>Название компании</label>
                  <input
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Отрасль</label>
                  <select
                    value={company.industry}
                    onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                  >
                    <option>Ресторан</option>
                    <option>Склад</option>
                    <option>Розничная торговля</option>
                    <option>Производство</option>
                    <option>Доставка</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Часовой пояс</label>
                  <select
                    value={company.timezone}
                    onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                  >
                    <option value="Asia/Bishkek">Asia/Bishkek (GMT+6)</option>
                    <option value="Asia/Almaty">Asia/Almaty (GMT+5)</option>
                    <option value="Asia/Tashkent">Asia/Tashkent (GMT+5)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Рабочая неделя</label>
                  <select
                    value={company.workWeek}
                    onChange={(e) => setCompany({ ...company, workWeek: e.target.value })}
                  >
                    <option value="5/2">5/2</option>
                    <option value="6/1">6/1</option>
                    <option value="2/2">2/2</option>
                    <option value="custom">Кастомная</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Макс. часов в неделю на сотрудника</label>
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={company.maxHoursPerWeek}
                  onChange={(e) =>
                    setCompany({ ...company, maxHoursPerWeek: Number(e.target.value) })
                  }
                />
              </div>
              <div className="form-actions end">
                {saved && <span className="save-hint">Сохранено</span>}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          )}

          {tab === 'notifications' && (
            <form className="form" onSubmit={onSave}>
              <h2 className="settings-section-title">Уведомления</h2>
              <p className="settings-section-sub">Когда и как присылать оповещения</p>
              <ToggleRow
                title="Email о новых сменах"
                desc="Когда вам назначают новую смену"
                value={notifications.emailShifts}
                onChange={(v) => setNotifications({ ...notifications, emailShifts: v })}
              />
              <ToggleRow
                title="Email о заявках на отгул"
                desc="Новые заявки и изменения статусов"
                value={notifications.emailTimeOff}
                onChange={(v) => setNotifications({ ...notifications, emailTimeOff: v })}
              />
              <ToggleRow
                title="Push о сменах"
                desc="Напоминание за час до начала смены"
                value={notifications.pushShifts}
                onChange={(v) => setNotifications({ ...notifications, pushShifts: v })}
              />
              <ToggleRow
                title="Push о заявках"
                desc="Только для менеджеров"
                value={notifications.pushTimeOff}
                onChange={(v) => setNotifications({ ...notifications, pushTimeOff: v })}
              />
              <ToggleRow
                title="Еженедельный дайджест"
                desc="Сводка по командe каждый понедельник"
                value={notifications.digestWeekly}
                onChange={(v) => setNotifications({ ...notifications, digestWeekly: v })}
              />
              <div className="form-actions end">
                {saved && <span className="save-hint">Сохранено</span>}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          )}

          {tab === 'security' && (
            <form className="form" onSubmit={onSave}>
              <h2 className="settings-section-title">Безопасность</h2>
              <p className="settings-section-sub">2FA, пароль и активные сессии</p>
              <ToggleRow
                title="Двухфакторная аутентификация"
                desc="Обязательно для ролей Owner и Manager"
                value={security.twoFactor}
                onChange={(v) => setSecurity({ ...security, twoFactor: v })}
              />
              <div className="field">
                <label>Таймаут сессии (минуты)</label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={security.sessionTimeout}
                  onChange={(e) =>
                    setSecurity({ ...security, sessionTimeout: Number(e.target.value) })
                  }
                />
              </div>
              <div className="divider" />
              <h3 className="settings-section-title small">Сменить пароль</h3>
              <div className="form-row">
                <div className="field">
                  <label>Текущий пароль</label>
                  <input
                    type="password"
                    value={security.currentPassword}
                    onChange={(e) =>
                      setSecurity({ ...security, currentPassword: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Новый пароль</label>
                  <input
                    type="password"
                    value={security.newPassword}
                    onChange={(e) =>
                      setSecurity({ ...security, newPassword: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-actions end">
                {saved && <span className="save-hint">Сохранено</span>}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  title,
  desc,
  value,
  onChange,
}: {
  title: string
  desc: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-title">{title}</div>
        <div className="toggle-desc">{desc}</div>
      </div>
      <button
        type="button"
        className={`toggle ${value ? 'on' : ''}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      >
        <span />
      </button>
    </div>
  )
}