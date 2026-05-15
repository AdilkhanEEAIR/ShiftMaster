import { useEffect, useMemo, useState } from 'react'
import { Plus, Check, X, Edit2, Trash2 } from 'lucide-react'
import { timeOffApi, employeesApi } from '../../api'
import type { TimeOffRequest, Employee, TimeOffType, TimeOffStatus } from '../../types'
import Modal from '../../components/Modal'

const TYPE_LABEL: Record<TimeOffType, string> = {
  SICK: 'Больничный',
  VACATION: 'Отпуск',
  PERSONAL: 'Личные',
  UNPAID: 'Без оплаты',
}
const STATUS_LABEL: Record<TimeOffStatus, { l: string; c: string }> = {
  PENDING: { l: 'Ожидает', c: 'badge-warning' },
  APPROVED: { l: 'Одобрено', c: 'badge-success' },
  REJECTED: { l: 'Отклонено', c: 'badge-danger' },
}

const EMPTY: Omit<TimeOffRequest, 'id' | 'createdAt' | 'status'> = {
  employeeId: '',
  type: 'SICK',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  reason: '',
}

export default function TimeOff() {
  const [list, setList] = useState<TimeOffRequest[]>([])
  const [emps, setEmps] = useState<Employee[]>([])
  const [filter, setFilter] = useState<'ALL' | TimeOffStatus>('ALL')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TimeOffRequest | null>(null)
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    timeOffApi.list().then(setList)
    employeesApi.list().then(setEmps)
  }, [])

  const filtered = useMemo(
    () => filter === 'ALL' ? list : list.filter(t => t.status === filter),
    [list, filter]
  )

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY, employeeId: emps[0]?.id ?? '' })
    setOpen(true)
  }
  function openEdit(t: TimeOffRequest) {
    setEditing(t)
    setForm({ employeeId: t.employeeId, type: t.type, startDate: t.startDate, endDate: t.endDate, reason: t.reason ?? '' })
    setOpen(true)
  }

  async function setStatus(t: TimeOffRequest, status: TimeOffStatus) {
    const upd = await timeOffApi.update(t.id, { status })
    setList(prev => prev.map(x => x.id === upd.id ? { ...upd, employeeName: x.employeeName } : x))
  }

  async function onSave() {
    setSaving(true)
    try {
      if (editing) {
        const upd = await timeOffApi.update(editing.id, form)
        setList(prev => prev.map(x => x.id === upd.id ? { ...upd, employeeName: emps.find(e => e.id === upd.employeeId)?.fullName } : x))
      } else {
        const cr = await timeOffApi.create(form)
        const withName = { ...cr, employeeName: emps.find(e => e.id === cr.employeeId)?.fullName }
        setList(prev => [withName, ...prev])
      }
      setOpen(false)
    } finally { setSaving(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('Удалить заявку?')) return
    await timeOffApi.remove(id)
    setList(prev => prev.filter(t => t.id !== id))
  }

  const days = (a: string, b: string) =>
    Math.round((+new Date(b) - +new Date(a)) / 86400000) + 1

  return (
    <div>
      <div className="page-header">
        <div className="flex gap-2 items-center" style={{ flex: 1 }}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
            <button key={s} className={'btn btn-sm ' + (filter === s ? 'btn-secondary' : 'btn-ghost')} onClick={() => setFilter(s)}>
              {s === 'ALL' ? 'Все' : STATUS_LABEL[s].l}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Новая заявка
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty"><h3>Заявок нет</h3><p>Все спокойно — никто не отсутствует.</p></div></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Тип</th>
                <th>Период</th>
                <th>Дней</th>
                <th>Причина</th>
                <th>Статус</th>
                <th style={{ textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">{t.employeeName?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{t.employeeName}</div>
                        <div className="text-xs text-muted mono">создано {t.createdAt}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-muted">{TYPE_LABEL[t.type]}</span>
                  </td>
                  <td className="mono text-sm">
                    {new Date(t.startDate).toLocaleDateString('ru')}<span className="text-muted"> → </span>{new Date(t.endDate).toLocaleDateString('ru')}
                  </td>
                  <td className="mono">{days(t.startDate, t.endDate)}</td>
                  <td className="text-sm text-secondary" style={{ maxWidth: 220 }}>{t.reason || <span className="text-muted">—</span>}</td>
                  <td>
                    <span className={'badge ' + STATUS_LABEL[t.status].c}>
                      <span className="badge-dot" />{STATUS_LABEL[t.status].l}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      {t.status === 'PENDING' && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => setStatus(t, 'APPROVED')} aria-label="Одобрить" title="Одобрить">
                            <Check size={15} style={{ color: 'var(--success)' }} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setStatus(t, 'REJECTED')} aria-label="Отклонить" title="Отклонить">
                            <X size={15} style={{ color: 'var(--danger)' }} />
                          </button>
                        </>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => onDelete(t.id)}><Trash2 size={14} /></button>
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
        title={editing ? 'Редактировать заявку' : 'Новая заявка на отгул'}
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
            {emps.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Тип</label>
          <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TimeOffType })}>
            {(Object.keys(TYPE_LABEL) as TimeOffType[]).map(k => (
              <option key={k} value={k}>{TYPE_LABEL[k]}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>С</label>
            <input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="field">
            <label>По</label>
            <input className="input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Причина (опц.)</label>
          <textarea className="textarea" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Краткое описание..." />
        </div>
      </Modal>
    </div>
  )
}