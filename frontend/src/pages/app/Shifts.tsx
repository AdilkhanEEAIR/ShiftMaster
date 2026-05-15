import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, Clock } from 'lucide-react'
import { shiftsApi, employeesApi, branchesApi, departmentsApi } from '../../api'
import type { Shift, Employee, Branch, Department, ShiftStatus } from '../../types'
import Modal from '../../components/Modal'

function emptyShift(): Omit<Shift, 'id'> {
  const now = new Date()
  const start = new Date(now); start.setHours(9, 0, 0, 0)
  const end = new Date(now); end.setHours(17, 0, 0, 0)
  return {
    employeeId: '',
    branchId: '',
    departmentId: '',
    startsAt: start.toISOString().slice(0, 16),
    endsAt: end.toISOString().slice(0, 16),
    status: 'SCHEDULED',
  }
}

const STATUS_LABEL: Record<ShiftStatus, { label: string; cls: string }> = {
  SCHEDULED: { label: 'Запланирована', cls: 'badge-muted' },
  IN_PROGRESS: { label: 'Идёт сейчас', cls: 'badge-success' },
  COMPLETED: { label: 'Завершена', cls: 'badge-accent' },
  CANCELLED: { label: 'Отменена', cls: 'badge-danger' },
}

export default function Shifts() {
  const [list, setList] = useState<Shift[]>([])
  const [emps, setEmps] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filter, setFilter] = useState<'ALL' | ShiftStatus>('ALL')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)
  const [form, setForm] = useState<Omit<Shift, 'id'>>(emptyShift())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    shiftsApi.list().then(setList)
    employeesApi.list().then(setEmps)
    branchesApi.list().then(setBranches)
    departmentsApi.list().then(setDepartments)
  }, [])

  const filtered = useMemo(
    () => filter === 'ALL' ? list : list.filter(s => s.status === filter),
    [list, filter]
  )

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyShift(), employeeId: emps[0]?.id ?? '', departmentId: departments[0]?.id ?? '', branchId: branches[0]?.id ?? '' })
    setOpen(true)
  }
  function openEdit(s: Shift) {
    setEditing(s)
    setForm({
      ...s,
      startsAt: s.startsAt.slice(0, 16),
      endsAt: s.endsAt.slice(0, 16),
    })
    setOpen(true)
  }

  async function onSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      }
      if (editing) {
        const upd = await shiftsApi.update(editing.id, payload)
        setList(prev => prev.map(s => s.id === upd.id ? upd : s))
      } else {
        const cr = await shiftsApi.create(payload)
        const withName = { ...cr, employeeName: emps.find(e => e.id === cr.employeeId)?.fullName }
        setList(prev => [withName, ...prev])
      }
      setOpen(false)
    } finally { setSaving(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('Удалить смену?')) return
    await shiftsApi.remove(id)
    setList(prev => prev.filter(s => s.id !== id))
  }

  function durationH(s: Shift) {
    return ((+new Date(s.endsAt) - +new Date(s.startsAt)) / 3600000).toFixed(1)
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex gap-2 items-center" style={{ flex: 1 }}>
          {(['ALL', 'IN_PROGRESS', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map(s => (
            <button
              key={s}
              className={'btn btn-sm ' + (filter === s ? 'btn-secondary' : 'btn-ghost')}
              onClick={() => setFilter(s)}
            >
              {s === 'ALL' ? 'Все' : STATUS_LABEL[s].label}
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> Новая смена
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty"><h3>Смен пока нет</h3><p>Создайте первую вручную или сгенерируйте через AI.</p></div></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Дата и время</th>
                <th>Длительность</th>
                <th>Объём (план / факт)</th>
                <th>Статус</th>
                <th style={{ textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">{s.employeeName?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{s.employeeName}</div>
                        <div className="text-xs text-muted">{departments.find(d => d.id === s.departmentId)?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono text-sm">
                    {new Date(s.startsAt).toLocaleString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    <span className="text-muted"> → </span>
                    {new Date(s.endsAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="mono text-sm">
                    <span className="badge badge-muted"><Clock size={11} /> {durationH(s)} ч</span>
                  </td>
                  <td className="mono text-sm">
                    {s.volumePlanned != null ? (
                      <>
                        {s.volumeActual ?? 0} <span className="text-muted">/ {s.volumePlanned}</span>
                      </>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <span className={'badge ' + STATUS_LABEL[s.status].cls}>
                      <span className="badge-dot" />{STATUS_LABEL[s.status].label}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => onDelete(s.id)}><Trash2 size={14} /></button>
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
        title={editing ? 'Редактировать смену' : 'Новая смена'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={onSave} disabled={saving}>
              {saving ? <span className="spinner" /> : (editing ? 'Сохранить' : 'Создать')}
            </button>
          </>
        }
      >
        <div className="field">
          <label>Сотрудник</label>
          <select className="select" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
            <option value="">— выбрать —</option>
            {emps.map(e => <option key={e.id} value={e.id}>{e.fullName} · {e.position}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Начало</label>
            <input className="input" type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
          </div>
          <div className="field">
            <label>Конец</label>
            <input className="input" type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Филиал</label>
            <select className="select" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Отдел</label>
            <select className="select" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Объём план</label>
            <input className="input" type="number" value={form.volumePlanned ?? ''} onChange={e => setForm({ ...form, volumePlanned: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Объём факт</label>
            <input className="input" type="number" value={form.volumeActual ?? ''} onChange={e => setForm({ ...form, volumeActual: Number(e.target.value) })} />
          </div>
        </div>
        <div className="field">
          <label>Статус</label>
          <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ShiftStatus })}>
            {(Object.keys(STATUS_LABEL) as ShiftStatus[]).map(k => (
              <option key={k} value={k}>{STATUS_LABEL[k].label}</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}