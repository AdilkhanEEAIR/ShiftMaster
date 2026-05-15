import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, Building2, Search } from 'lucide-react'
import { branchesApi } from '../../api'
import type { Branch } from '../../types'
import Modal from '../../components/Modal'

type FormState = {
  name: string
  address: string
  city: string
  active: boolean
}

const EMPTY: FormState = { name: '', address: '', city: 'Бишкек', active: true }

export default function Branches() {
  const [items, setItems] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    branchesApi.list()
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q),
    )
  }, [items, query])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(b: Branch) {
    setEditing(b)
    setForm({ name: b.name, address: b.address, city: b.city, active: b.active })
    setOpen(true)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const updated = await branchesApi.update(editing.id, form)
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      } else {
        const created = await branchesApi.create({ ...form, employeeCount: 0 })
        setItems((prev) => [created, ...prev])
      }
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function onRemove(b: Branch) {
    if (!confirm(`Удалить филиал «${b.name}»?`)) return
    await branchesApi.remove(b.id)
    setItems((prev) => prev.filter((it) => it.id !== b.id))
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Филиалы</h1>
          <p className="page-sub">Управление точками и подразделениями компании</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Новый филиал
        </button>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <Search size={16} />
          <input
            placeholder="Поиск по названию, городу или адресу..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">Филиалы не найдены</div>
      ) : (
        <div className="card-grid">
          {filtered.map((b) => (
            <div key={b.id} className="info-card">
              <div className="info-card-head">
                <div className="info-icon">
                  <Building2 size={20} />
                </div>
                <div className={`badge ${b.active ? 'success' : 'muted'}`}>
                  <span className="dot" />
                  {b.active ? 'Активен' : 'Неактивен'}
                </div>
              </div>
              <h3 className="info-title">{b.name}</h3>
              <div className="info-row">
                <MapPin size={14} />
                <span>
                  {b.city}, {b.address}
                </span>
              </div>
              <div className="info-stat">
                <span className="info-stat-value">{b.employeeCount ?? 0}</span>
                <span className="info-stat-label">сотрудников</span>
              </div>
              <div className="info-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>
                  <Pencil size={14} /> Изменить
                </button>
                <button className="btn btn-ghost btn-sm danger" onClick={() => onRemove(b)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Изменить филиал' : 'Новый филиал'}
      >
        <form className="form" onSubmit={onSave}>
          <div className="field">
            <label>Название</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Бишкек — Центральный"
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Город</label>
              <input
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Статус</label>
              <select
                value={form.active ? '1' : '0'}
                onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}
              >
                <option value="1">Активен</option>
                <option value="0">Неактивен</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Адрес</label>
            <input
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="пр. Чуй 154"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}