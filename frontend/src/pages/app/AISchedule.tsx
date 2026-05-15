import { useState } from 'react'
import { Sparkles, Send, Wand2, Check, Loader2, RefreshCw } from 'lucide-react'
import { aiApi } from '../../api'
import type { Shift } from '../../types'

const EXAMPLES = [
  'Составь расписание на неделю: никто не работает больше 8 часов, у каждого 2 выходных',
  'Алибек не работает по пятницам, остальные стандартный график 5/2',
  'Покрой смены 9–17 в Бишкек-Центральный, минимум 3 человека на складе',
  'Сгенерируй график без переработок, приоритет — повара кухни',
]

export default function AISchedule() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    shifts: Shift[]
    explanation: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onGenerate(e?: React.FormEvent) {
    e?.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await aiApi.generateSchedule(prompt.trim())
      setResult({ shifts: res.shifts, explanation: res.explanation })
    } catch {
      setError('Не удалось сгенерировать расписание. Попробуй ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResult(null)
    setPrompt('')
    setError(null)
  }

  return (
    <div className="page ai-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <Sparkles size={22} className="title-icon" /> AI Расписание
          </h1>
          <p className="page-sub">
            Опиши на естественном языке как хочешь распределить смены — мы сгенерируем оптимальный график
          </p>
        </div>
      </div>

      <div className="ai-prompt-card">
        <form onSubmit={onGenerate}>
          <div className="ai-prompt-head">
            <Wand2 size={18} />
            <span>Опиши задачу</span>
          </div>
          <textarea
            className="ai-prompt-input"
            rows={4}
            placeholder="Например: составь график на неделю, никто не работает больше 8 часов в день, у каждого минимум 2 выходных подряд..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <div className="ai-prompt-foot">
            <span className="ai-hint">Shift + Enter — новая строка</span>
            <button type="submit" className="btn btn-primary" disabled={loading || !prompt.trim()}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Генерируем...
                </>
              ) : (
                <>
                  <Send size={16} /> Сгенерировать
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {!result && !loading && (
        <div className="ai-examples">
          <div className="ai-examples-label">Примеры запросов</div>
          <div className="ai-chips">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="ai-chip"
                onClick={() => setPrompt(ex)}
                type="button"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="banner danger">{error}</div>}

      {result && (
        <>
          <div className="ai-result-head">
            <div className="ai-success">
              <div className="ai-success-icon">
                <Check size={18} />
              </div>
              <div>
                <div className="ai-success-title">Расписание готово</div>
                <div className="ai-success-sub">{result.explanation}</div>
              </div>
            </div>
            <div className="ai-result-actions">
              <button className="btn btn-ghost" onClick={reset}>
                <RefreshCw size={14} /> Заново
              </button>
              <button className="btn btn-primary">
                <Check size={14} /> Применить расписание
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>Начало</th>
                  <th>Конец</th>
                  <th>Длительность</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {result.shifts.map((s) => {
                  const start = new Date(s.startsAt)
                  const end = new Date(s.endsAt)
                  const hours = Math.round(((end.getTime() - start.getTime()) / 36e5) * 10) / 10
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="cell-strong">{s.employeeName}</div>
                      </td>
                      <td>
                        {start.toLocaleDateString('ru')} {start.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        {end.toLocaleDateString('ru')} {end.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>{hours} ч</td>
                      <td>
                        <div className="badge accent">
                          <span className="dot" />
                          AI-черновик
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}