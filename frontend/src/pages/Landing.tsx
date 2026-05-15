import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Sparkles, Calendar, Users, BarChart3,
  Zap, ShieldCheck, MapPin, Activity, LayoutDashboard,
} from 'lucide-react'
import Logo from '../components/Logo'

export default function Landing() {
  return (
    <div className="landing">
      {/* NAV */}
      <header className="landing-nav">
        <div className="container">
          <Link to="/" className="logo">
            <Logo />
            <span>ShiftMaster</span>
          </Link>
          <nav className="landing-nav-links">
            <a href="#features">Возможности</a>
            <a href="#ai">AI</a>
            <a href="#pricing">Тарифы</a>
            <a href="#stack">Технологии</a>
          </nav>
          <div className="flex gap-2 items-center">
            <Link to="/login" className="btn btn-ghost btn-sm">Войти</Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Начать бесплатно <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-tag">
            <Sparkles size={13} /> AI-оптимизатор расписания
          </div>
          <h1>
            Расписания, которые<br />
            <span className="grad">собираются сами</span>.
          </h1>
          <p className="lead">
            ShiftMaster — умная система управления сменами для предприятий, складов и ресторанов.
            Напишите правила на родном языке — алгоритм построит график за секунды.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Попробовать 14 дней бесплатно <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Посмотреть демо</Link>
          </div>

          {/* HERO MOCK */}
          <div className="hero-mock">
            <div className="hero-mock-frame">
              <div>
                <MockDashboard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Возможности</div>
            <h2>Всё, что нужно для управления командой</h2>
            <p>От ручных Excel-таблиц к интеллектуальной системе. Шесть инструментов вместо одного хаоса.</p>
          </div>

          <div className="features-grid">
            <Feature
              icon={<Sparkles size={20} />}
              title="AI Schedule Optimizer"
              desc='Менеджер пишет на естественном языке: «не больше 8 часов, у каждого 2 выходных» — система строит оптимальный график.'
            />
            <Feature
              icon={<Zap size={20} />}
              title="Smart Replacement"
              desc='Кто-то заболел — алгоритм ранжирует кандидатов по навыкам и нагрузке, рассылает push-уведомления автоматически.'
            />
            <Feature
              icon={<Calendar size={20} />}
              title="Drag-and-drop смены"
              desc='Создание, клонирование и редактирование расписания. Поддержка повторяющихся шаблонов и шорткатов.'
            />
            <Feature
              icon={<MapPin size={20} />}
              title="Punch-in с геолокацией"
              desc='Сотрудник отмечается через мобильное PWA-приложение. Опоздания и переработки рассчитываются автоматически.'
            />
            <Feature
              icon={<Activity size={20} />}
              title="Live Dashboard"
              desc='WebSocket-обновления каждые 15 секунд: кто на смене, кто на обеде, кто заболел — без перезагрузки.'
            />
            <Feature
              icon={<BarChart3 size={20} />}
              title="Performance vs Volume"
              desc='Менеджер вводит объём — система сравнивает с планом и предсказывает, успеваете ли к дедлайну.'
            />
            <Feature
              icon={<Users size={20} />}
              title="Три роли RBAC"
              desc='Owner, Manager, Worker. У каждого свой интерфейс и набор прав. 2FA для Owner и Manager обязательно.'
            />
            <Feature
              icon={<ShieldCheck size={20} />}
              title="Локализация СНГ"
              desc='Кыргызстан, Казахстан, Узбекистан. Интеграция с 1С и Kaspi. Поддержка на русском и кыргызском.'
            />
          </div>
        </div>
      </section>

      {/* AI SHOWCASE */}
      <section className="section" id="ai" style={{ borderTop: '1px solid var(--border)', background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.08), transparent 50%)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Главная фишка</div>
            <h2>Опишите расписание словами — получите готовый план</h2>
            <p>Никаких сложных интерфейсов. Просто напишите свои правила, как сказали бы менеджеру.</p>
          </div>

          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="ai-prompt-box" style={{ pointerEvents: 'none' }}>
              <textarea
                readOnly
                value={'Никто не работает больше 8 часов. У каждого 2 выходных в неделю. Алибек не работает по пятницам. Айгуль — только утренние смены. Минимум 2 человека на кухне в обед.'}
              />
              <div className="ai-prompt-bar">
                <span className="text-muted text-xs">⌘ + Enter — сгенерировать</span>
                <span className="btn btn-primary btn-sm">
                  <Sparkles size={14} /> Сгенерировать
                </span>
              </div>
            </div>

            <div className="ai-suggestions">
              <span className="ai-chip">⏱ Не больше 40 часов в неделю</span>
              <span className="ai-chip">📅 Ротация выходных</span>
              <span className="ai-chip">🧑‍🍳 Учёт навыков</span>
              <span className="ai-chip">⚖️ Равная нагрузка</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Тарифы</div>
            <h2>Простая цена. Без обмана.</h2>
            <p>За команду, не за пользователя. Connecteam для 30 человек — $240/мес. Мы — $35.</p>
          </div>

          <div className="pricing-grid">
            <PriceCard
              name="Starter"
              desc="Базовый CRUD без AI"
              price="$15"
              features={['До 15 сотрудников', 'CRUD смен и сотрудников', 'Punch-in / Punch-out', 'Мобильное PWA', 'Email-поддержка']}
            />
            <PriceCard
              featured
              name="Growth"
              desc="Самый популярный"
              price="$35"
              features={['До 50 сотрудников', 'Всё из Starter', 'AI Schedule Optimizer', 'Smart Replacement Matching', 'Live Dashboard (WebSocket)', 'Аналитика и отчёты']}
            />
            <PriceCard
              name="Enterprise"
              desc="Для сетей и масштаба"
              price="$90+"
              features={['Неограниченно сотрудников', 'Мультифилиальность', 'API-интеграции (1С, Kaspi)', 'Выделенная поддержка', 'SLA 99.9%', 'Кастомные отчёты']}
            />
          </div>
        </div>
      </section>

      {/* STACK */}
      <section className="section" id="stack" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Стек</div>
            <h2>Современный, проверенный, масштабируемый</h2>
            <p>React + TypeScript на фронте, Spring Boot или FastAPI на бэке, PostgreSQL и OR-Tools для оптимизатора.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
            {['React 19', 'TypeScript', 'Spring Boot', 'PostgreSQL', 'Redis', 'WebSocket', 'OR-Tools', 'FCM', 'Docker', 'K8s'].map(t => (
              <span key={t} className="badge badge-muted" style={{ padding: '8px 14px', fontSize: 13 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingTop: 32, paddingBottom: 96 }}>
        <div className="container-sm" style={{ textAlign: 'center' }}>
          <div style={{ padding: '56px 32px', background: 'linear-gradient(180deg, var(--accent-soft), transparent)', border: '1px solid var(--accent-border)', borderRadius: 20 }}>
            <h2 style={{ fontSize: 36, letterSpacing: '-0.03em' }}>Готовы остановить WhatsApp-хаос?</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 17 }}>
              14 дней бесплатно. Без карты. Без обязательств.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>
              Начать сейчас <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <span>ShiftMaster © 2026</span>
          </div>
          <div className="flex gap-4">
            <a href="#" style={{ color: 'var(--text-muted)' }}>Документация</a>
            <a href="#" style={{ color: 'var(--text-muted)' }}>Поддержка</a>
            <a href="#" style={{ color: 'var(--text-muted)' }}>Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="feature">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  )
}

function PriceCard({ name, desc, price, features, featured }: { name: string; desc: string; price: string; features: string[]; featured?: boolean }) {
  return (
    <div className={'price-card' + (featured ? ' featured' : '')}>
      <div className="flex items-center justify-between">
        <h3>{name}</h3>
        {featured && <span className="badge badge-accent">Популярный</span>}
      </div>
      <div className="desc">{desc}</div>
      <div className="price-amount">
        <span className="num">{price}</span>
        <span className="per">/ мес</span>
      </div>
      <ul className="price-features">
        {features.map(f => (
          <li key={f}><Check size={15} /> {f}</li>
        ))}
      </ul>
      <Link to="/register" className={featured ? 'btn btn-primary' : 'btn btn-secondary'}>
        Выбрать
      </Link>
    </div>
  )
}

/* Mini mock dashboard inside hero */
function MockDashboard() {
  return (
    <div style={{ padding: 18, fontFamily: 'var(--font-sans)', textAlign: 'left' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 18 }}>
        <div style={{ borderRight: '1px solid var(--border)', paddingRight: 14 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <Logo size={22} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>ShiftMaster</span>
          </div>
          {[
            { i: <LayoutShim />, l: 'Обзор', a: true },
            { i: <Sparkles size={14} />, l: 'AI Расписание' },
            { i: <Calendar size={14} />, l: 'Смены' },
            { i: <Users size={14} />, l: 'Сотрудники' },
            { i: <BarChart3 size={14} />, l: 'Аналитика' },
          ].map((it, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '6px 10px', fontSize: 12,
              color: it.a ? 'var(--accent-hover)' : 'var(--text-secondary)',
              background: it.a ? 'var(--accent-soft)' : 'transparent',
              borderRadius: 6,
              marginBottom: 2,
            }}>
              {it.i}
              {it.l}
            </div>
          ))}
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            {[{ l: 'Активных смен', v: '12' }, { l: 'Сотрудников', v: '36' }, { l: 'Заявок', v: '4' }].map((s, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.l}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Live: кто сейчас работает</div>
            {[
              { n: 'Алибек Жумабаев', r: 'Склад', t: '09:00 — 17:00' },
              { n: 'Айгуль Орозова', r: 'Кухня', t: '11:00 — 22:00' },
              { n: 'Мээрим Жалилова', r: 'Кухня', t: '10:00 — 20:00' },
            ].map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>{u.n[0]}</div>
                <div style={{ flex: 1, fontSize: 12 }}>{u.n}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.r}</div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-hover)' }}>{u.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
function LayoutShim() { return <LayoutDashboard size={14} /> }