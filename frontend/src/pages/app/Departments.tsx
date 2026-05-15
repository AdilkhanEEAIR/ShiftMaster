import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Users, Search, Layers } from 'lucide-react'
import { departmentsApi } from '../../api'
import type { Department } from '../../types'
import Modal from '../../components/Modal'

type FormState = {
  name: string
  description: string
  color: string
}

const PALETTE = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899']
const EMPTY: FormState = { name: '', description: '', color: PALETTE[0] }

export default function Departments() {
  const [items, setItems] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    departmentsApi.list()
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (d) =>
        d.name.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q),
    )
  }, [items, query])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(d: Department) {
    setEditing(d)
    setForm({
      name: d.name,
      description: d.description ?? '',
      color: d.color ?? PALETTE[0],
    })
    setOpen(true)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const updated = await departmentsApi.update(editing.id, form)
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      } else {
        const created = await departmentsApi.create({ ...form, employeeCount: 0 })
        setItems((prev) => [created, ...prev])
      }
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function onRemove(d: Department) {
    if (!confirm(`Удалить отдел «${d.name}»?`)) return
    await departmentsApi.remove(d.id)
    setItems((prev) => prev.filter((it) => it.id !== d.id))
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Отделы</h1>
          <p className="page-sub">Структура подразделений и их состав</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Новый отдел
        </button>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <Search size={16} />
          <input
            placeholder="Поиск по названию..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">Отделы не найдены</div>
      ) : (
        <div className="card-grid">
          {filtered.map((d) => (
            <div key={d.id} className="info-card">
              <div className="info-card-head">
                <div
                  className="info-icon"
                  style={{
                    background: `${d.color ?? '#3b82f6'}22`,
                    color: d.color ?? '#3b82f6',
                  }}
                >
                  <Layers size={20} />
                </div>
                <div
                  className="color-chip"
                  style={{ background: d.color ?? '#3b82f6' }}
                  title={d.color}
                />
              </div>
              <h3 className="info-title">{d.name}</h3>
              <p className="info-desc">{d.description || '—'}</p>
              <div className="info-stat">
                <Users size={16} />
                <span className="info-stat-value">{d.employeeCount ?? 0}</span>
                <span className="info-stat-label">сотрудников</span>
              </div>
              <div className="info-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>
                  <Pencil size={14} /> Изменить
                </button>
                <button className="btn btn-ghost btn-sm danger" onClick={() => onRemove(d)}>
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
        title={editing ? 'Изменить отдел' : 'Новый отдел'}
      >
        <form className="form" onSubmit={onSave}>
          <div className="field">
            <label>Название</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Склад"
            />
          </div>
          <div className="field">
            <label>Описание</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Приём и отгрузка товара"
            />
          </div>
          <div className="field">
            <label>Цвет</label>
            <div className="color-picker">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${form.color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
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