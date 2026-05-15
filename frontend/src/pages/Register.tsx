import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../auth'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ fullName: '', companyName: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await register(form)
      nav('/app')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const upd = <K extends keyof typeof form>(k: K, v: string) => setForm(s => ({ ...s, [k]: v }))

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="flex items-center gap-3" style={{ marginBottom: 22 }}>
          <Logo size={28} />
          <span className="fw-600">ShiftMaster</span>
        </Link>

        <h1>Создать аккаунт</h1>
        <p className="lead">14 дней бесплатно. Без карты.</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Ваше имя</label>
            <input className="input" value={form.fullName} onChange={e => upd('fullName', e.target.value)} placeholder="Иван Иванов" required />
          </div>
          <div className="field">
            <label>Название компании</label>
            <input className="input" value={form.companyName} onChange={e => upd('companyName', e.target.value)} placeholder="ОсОО «Ваша компания»" required />
          </div>
          <div className="field">
            <label>Рабочий email</label>
            <input className="input" type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="you@company.kg" required />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input className="input" type="password" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="Минимум 8 символов" minLength={8} required />
          </div>

          {err && <div className="badge badge-danger" style={{ marginTop: 12 }}>{err}</div>}

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <>Создать аккаунт <ArrowRight size={15} /></>}
          </button>
        </form>

        <div className="auth-foot">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  )
}