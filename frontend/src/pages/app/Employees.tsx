import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Mail, Phone } from 'lucide-react'
import { employeesApi, branchesApi, departmentsApi } from '../../api'
import type { Employee, Branch, Department } from '../../types'
import Modal from '../../components/Modal'

const EMPTY: Omit<Employee, 'id'> = {
  fullName: '', email: '', phone: '', position: '',
  departmentId: '', branchId: '',
  hireDate: new Date().toISOString().slice(0, 10),
  status: 'ACTIVE',
}

export default function Employees() {
  const [list, setList] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | Employee['status']>('ALL')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState<Omit<Employee, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    employeesApi.list().then(setList)
    branchesApi.list().then(setBranches)
    departmentsApi.list().then(setDepartments)
  }, [])

  const filtered = useMemo(() => list.filter(e => {
    if (filterStatus !== 'ALL' && e.status !== filterStatus) return false
    if (!q) return true
    const s = q.toLowerCase()
    return e.fullName.toLowerCase().includes(s) ||
           e.email.toLowerCase().includes(s) ||
           e.position.toLowerCase().includes(s)
  }), [list, q, filterStatus])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY, departmentId: departments[0]?.id ?? '', branchId: branches[0]?.id ?? '' })
    setOpen(true)
  }
  function openEdit(emp: Employee) {
    setEditing(emp)
    const { id: _id, ...rest } = emp
    setForm(rest)
    setOpen(true)
  }

  async function onSave() {
    setSaving(true)
    try {
      if (editing) {
        const upd = await employeesApi.update(editing.id, form)
        setList(prev => prev.map(e => e.id === upd.id ? upd : e))
      } else {
        const created = await employeesApi.create(form)
        setList(prev => [created, ...prev])
      }
      setOpen(false)
    } finally { setSaving(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('Архивировать сотрудника? История будет сохранена.')) return
    await employeesApi.remove(id)
    setList(prev => prev.filter(e => e.id !== id))
  }

  const dep = (id: string) => departments.find(d => d.id === id)
  const br = (id: string) => branches.find(b => b.id === id)

  return (
    <div>
      <div className="page-header">
        <div className="flex gap-3 items-center" style={{ flex: 1 }}>
          <div style={{ position: 'relative', maxWidth: 360, flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Поиск по имени, email, должности..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'ALL' | Employee['status'])} style={{ width: 180 }}>
            <option value="ALL">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="ON_LEAVE">В отпуске</option>
            <option value="ARCHIVED">Архив</option>
          </select>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> Добавить
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><Plus size={20} /></div>
            <h3>Никого не нашли</h3>
            <p>Попробуйте изменить поиск или добавьте первого сотрудника.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Должность</th>
                <th>Контакты</th>
                <th>Отдел</th>
                <th>Филиал</th>
                <th>Статус</th>
                <th style={{ textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">{emp.fullName[0]}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{emp.fullName}</div>
                        <div className="text-muted text-xs mono">с {new Date(emp.hireDate).toLocaleDateString('ru')}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.position}</td>
                  <td>
                    <div className="text-sm flex items-center gap-2"><Mail size={13} className="text-muted" /> {emp.email}</div>
                    <div className="text-xs text-muted flex items-center gap-2 mono"><Phone size={11} /> {emp.phone}</div>
                  </td>
                  <td>
                    {dep(emp.departmentId) && (
                      <span className="badge badge-muted">
                        <span className="badge-dot" style={{ background: dep(emp.departmentId)?.color }} />
                        {dep(emp.departmentId)?.name}
                      </span>
                    )}
                  </td>
                  <td className="text-secondary text-sm">{br(emp.branchId)?.name ?? '—'}</td>
                  <td>
                    {emp.status === 'ACTIVE' && <span className="badge badge-success"><span className="badge-dot" />Активен</span>}
                    {emp.status === 'ON_LEAVE' && <span className="badge badge-warning"><span className="badge-dot" />В отпуске</span>}
                    {emp.status === 'ARCHIVED' && <span className="badge badge-muted">Архив</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(emp)} aria-label="Редактировать">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => onDelete(emp.id)} aria-label="Удалить">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Редактировать сотрудника' : 'Новый сотрудник'}
        description="Все поля кроме навыков обязательны"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={onSave} disabled={saving}>
              {saving ? <span className="spinner" /> : (editing ? 'Сохранить' : 'Добавить')}
            </button>
          </>
        }
      >
        <div className="field">
          <label>ФИО</label>
          <input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Иван Иванов" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Телефон</label>
            <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+996 ..." />
          </div>
        </div>
        <div className="field">
          <label>Должность</label>
          <input className="input" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Отдел</label>
            <select className="select" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Филиал</label>
            <select className="select" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Дата найма</label>
            <input className="input" type="date" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} />
          </div>
          <div className="field">
            <label>Ставка (сом/час)</label>
            <input className="input" type="number" value={form.hourlyRate ?? ''} onChange={e => setForm({ ...form, hourlyRate: Number(e.target.value) })} />
          </div>
        </div>
        <div className="field">
          <label>Статус</label>
          <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Employee['status'] })}>
            <option value="ACTIVE">Активен</option>
            <option value="ON_LEAVE">В отпуске</option>
            <option value="ARCHIVED">Архив</option>
          </select>
        </div>
      </Modal>
    </div>
  )
}