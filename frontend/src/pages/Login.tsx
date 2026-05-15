import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, Lock } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../auth'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('manager@sm.kg')
  const [password, setPassword] = useState('demo123')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await login(email, password)
      nav('/app')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="flex items-center gap-3" style={{ marginBottom: 22 }}>
          <Logo size={28} />
          <span className="fw-600">ShiftMaster</span>
        </Link>

        <h1>С возвращением</h1>
        <p className="lead">Войдите, чтобы продолжить управление сменами.</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft: 38 }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.kg"
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Пароль</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft: 38 }}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {err && <div className="badge badge-danger" style={{ marginTop: 12 }}>{err}</div>}

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <>Войти <ArrowRight size={15} /></>}
          </button>
        </form>

        <div className="auth-foot">
          Нет аккаунта? <Link to="/register">Создать</Link>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          💡 <b>Демо-доступ:</b> любой email + пароль работают (моковый режим).
          Чтобы войти как Owner — используйте email с «owner», как Worker — с «worker».
        </div>
      </div>
    </div>
  )
}