'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Globe, LockKeyhole, Plus } from 'lucide-react';
import { categories, findService, openingHours, services, staff as allStaff, type Staff } from '../../lib/config';
import { BLOCK, serviceName, staffHours, type Booking } from '../../lib/schedule';
import type { User } from '../../lib/server/auth';
import { addDays, dateLabel, salonNow, time, today, weekStart } from '../../lib/time';
import { api } from '../modal';
import { BookingEditor, type EditorTarget } from './booking-editor';

const HOUR_PX = 88;
const PX = HOUR_PX / 60;

// Limites verticais da grelha: do primeiro ao último minuto de trabalho de qualquer profissional.
const allIntervals = [openingHours, ...allStaff.map(s => s.hours ?? {})].flatMap(w => Object.values(w).flat());
const DAY_START = Math.min(...allIntervals.map(i => i[0]));
const DAY_END = Math.max(...allIntervals.map(i => i[1]));
const GRID_HEIGHT = (DAY_END - DAY_START) * PX;

const initials = (name: string) => name.split(' ').map(n => n[0]).join('');

type Column = { key: string; staff: Staff; date: string; title: string; subtitle: string };

export function Agenda({ user }: { user: User }) {
  const ownStaff = user.role === 'owner' ? null : user.staffId;
  const [date, setDate] = useState(today);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [staffFilter, setStaffFilter] = useState(ownStaff ?? 'all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [data, setData] = useState<{ query: string; bookings?: Booking[]; error?: string }>({ query: '' });
  const [reloads, setReloads] = useState(0);
  const [editor, setEditor] = useState<(EditorTarget & { n: number }) | null>(null);
  const [notice, setNotice] = useState('');

  const from = view === 'day' ? date : weekStart(date);
  const to = view === 'day' ? date : addDays(from, 6);
  const query = `from=${from}&to=${to}`;
  const loading = data.query !== query;
  const bookings = data.query === query ? data.bookings ?? [] : [];
  const error = data.query === query ? data.error : '';

  useEffect(() => {
    let alive = true;
    const load = () => api<{ bookings: Booking[] }>(`/api/admin/bookings?${query}`)
      .then(r => alive && setData({ query, bookings: r.bookings }))
      .catch(e => {
        if (!alive) return;
        if (e.status === 401) location.href = '/entrar';
        else setData({ query, error: e.message });
      });
    load();
    // Atualizar quando se volta ao separador e a cada minuto (marcações online).
    const onFocus = () => document.visibilityState === 'visible' && load();
    window.addEventListener('focus', onFocus);
    const timer = setInterval(onFocus, 60_000);
    return () => { alive = false; window.removeEventListener('focus', onFocus); clearInterval(timer); };
  }, [query, reloads]);

  const service = findService(serviceFilter);
  const visibleStaff = allStaff.filter(s =>
    (ownStaff ? s.id === ownStaff : staffFilter === 'all' || s.id === staffFilter) && (!service || service.staff.includes(s.id)));
  const matches = (b: Booking) => serviceFilter === 'all' || b.service === serviceFilter;
  const shown = bookings.filter(b => visibleStaff.some(s => s.id === b.staff));
  const clientBookings = shown.filter(b => b.service !== BLOCK && matches(b));

  const move = (n: number) => setDate(d => addDays(d, view === 'week' ? 7 * n : n));
  const open = (target: EditorTarget) => setEditor({ ...target, n: (editor?.n ?? 0) + 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(from, i));

  let body;
  if (error) {
    body = <div role='alert' className='empty'>{error}<button onClick={() => setReloads(n => n + 1)}>Tentar novamente</button></div>;
  } else if (!visibleStaff.length) {
    body = <div className='empty'>{ownStaff ? 'A sua conta não está associada a nenhum profissional. Peça à gerência para a associar.' : 'Nenhum profissional faz este serviço.'}</div>;
  } else if (view === 'week' && visibleStaff.length > 1) {
    body = <WeekMatrix days={weekDays} people={visibleStaff} bookings={shown.filter(matches)} loading={loading}
      onDay={d => { setDate(d); setView('day'); }} onSelect={b => open({ booking: b })} />;
  } else {
    const columns: Column[] = view === 'day'
      ? visibleStaff.map(s => ({ key: s.id, staff: s, date, title: s.name, subtitle: s.role }))
      : weekDays.map(d => ({ key: d, staff: visibleStaff[0], date: d, title: dateLabel(d, { weekday: 'short', day: 'numeric' }), subtitle: dateLabel(d, { month: 'long' }) }));
    body = <TimeGrid columns={columns} bookings={shown} loading={loading} matches={matches}
      onSelect={b => open({ booking: b })} onCreate={(staffId, d, start) => open({ staffId, date: d, start })} />;
  }

  return (
    <>
      <header className='dash-top'>
        <div>
          <div className='eyebrow'>{ownStaff ? 'A MINHA AGENDA' : 'AGENDA DA EQUIPA'}</div>
          <h1>Olá, {user.name.split(' ')[0]}<span>.</span></h1>
          <p className='capitalize'>{dateLabel(today())}</p>
        </div>
        <button className='primary' onClick={() => open({ date: date < today() ? today() : date, staffId: visibleStaff[0]?.id })}><Plus size={18} /> Nova marcação</button>
      </header>

      <div className='stats'>
        <div><span>Marcações {view === 'day' ? 'do dia' : 'da semana'}</span><strong>{loading ? '—' : clientBookings.length}</strong></div>
        <div><span>Horas reservadas</span><strong>{loading ? '—' : (clientBookings.reduce((a, b) => a + b.duration, 0) / 60).toLocaleString('pt-PT')}<small> h</small></strong></div>
        <div><span>Marcadas online</span><strong>{loading ? '—' : clientBookings.filter(b => b.source === 'online').length}</strong></div>
      </div>

      <section className='calendar-panel'>
        <div className='calendar-toolbar'>
          <div className='date-controls'>
            <button aria-label='Anterior' onClick={() => move(-1)}><ChevronLeft size={18} /></button>
            <button aria-label='Seguinte' onClick={() => move(1)}><ChevronRight size={18} /></button>
            <h2>{view === 'day' ? dateLabel(date) : `${dateLabel(from, { day: 'numeric', month: 'short' })} – ${dateLabel(to, { day: 'numeric', month: 'short' })}`}</h2>
            <button onClick={() => setDate(today())}>Hoje</button>
            <input aria-label='Escolher data' type='date' value={date} onChange={e => e.target.value && setDate(e.target.value)} />
          </div>
          <div className='segmented'>
            <button className={view === 'day' ? 'selected' : ''} onClick={() => setView('day')}>Dia</button>
            <button className={view === 'week' ? 'selected' : ''} onClick={() => setView('week')}>Semana</button>
          </div>
        </div>
        <div className='filter-row'>
          {!ownStaff && (
            <div className='chips' role='group' aria-label='Profissional'>
              <button className={staffFilter === 'all' ? 'active' : ''} onClick={() => setStaffFilter('all')}>Toda a equipa</button>
              {allStaff.map(s => (
                <button key={s.id} className={staffFilter === s.id ? 'active' : ''} onClick={() => setStaffFilter(s.id)}>
                  <span className='dot' style={{ background: s.color }} />{s.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
          <div className='filter-actions'>
            <select aria-label='Serviço' className='compact' value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}>
              <option value='all'>Todos os serviços</option>
              {categories.map(c => (
                <optgroup key={c} label={c}>
                  {services.filter(s => s.category === c).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ))}
            </select>
            <button className='text-button' onClick={() => open({ block: true, date: date < today() ? today() : date, staffId: visibleStaff[0]?.id })}>
              <LockKeyhole size={15} /> Bloquear horário
            </button>
          </div>
        </div>
        {body}
        <div className='calendar-foot'>
          <span><Globe size={12} /> Marcada online</span>
          <span>Clique num espaço livre para marcar · as áreas riscadas estão fora do horário</span>
        </div>
      </section>

      {editor && (
        <BookingEditor key={editor.n} target={editor} user={user}
          onClose={() => setEditor(null)}
          onSaved={(message, savedDate) => {
            setEditor(null);
            setNotice(message);
            if (savedDate && (savedDate < from || savedDate > to)) setDate(savedDate);
            else setReloads(n => n + 1);
          }} />
      )}
      {notice && <div className='toast' role='status'>{notice}<button aria-label='Fechar aviso' onClick={() => setNotice('')}>×</button></div>}
    </>
  );
}

/** Zonas fora do horário de trabalho (riscadas) para um profissional num dia. */
function offHours(staffId: string, date: string) {
  const hours = staffHours(staffId, date);
  if (!hours.length) return [{ from: DAY_START, to: DAY_END, label: 'Fechado' }];
  const gaps: { from: number; to: number; label: string }[] = [];
  let cursor = DAY_START;
  hours.forEach(([a, b], i) => {
    if (a > cursor) gaps.push({ from: cursor, to: a, label: i === 0 ? '' : `Pausa · ${time(cursor)}–${time(a)}` });
    cursor = Math.max(cursor, b);
  });
  if (cursor < DAY_END) gaps.push({ from: cursor, to: DAY_END, label: '' });
  return gaps;
}

function TimeGrid({ columns, bookings, loading, matches, onSelect, onCreate }: {
  columns: Column[];
  bookings: Booking[];
  loading: boolean;
  matches: (b: Booking) => boolean;
  onSelect: (b: Booking) => void;
  onCreate: (staffId: string, date: string, start: number) => void;
}) {
  const now = salonNow();
  const hours = Array.from({ length: Math.floor((DAY_END - DAY_START) / 60) + 1 }, (_, i) => DAY_START + i * 60);
  return (
    <div className='calendar-scroll' aria-busy={loading}>
      <div className='calendar' style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(150px,1fr))` }}>
        <div className='time-head'><Clock size={17} /></div>
        {columns.map(c => (
          <div className='staff-head' key={c.key}>
            <span className='avatar' style={{ background: c.staff.color + '18', color: c.staff.color }}>{initials(c.staff.name)}</span>
            <div><strong className='capitalize'>{c.title}</strong><small className='capitalize'>{c.subtitle}</small></div>
          </div>
        ))}
        <div className='time-axis' style={{ height: GRID_HEIGHT }}>
          {hours.map(h => <span key={h} style={{ top: (h - DAY_START) * PX }}>{time(h)}</span>)}
        </div>
        {columns.map(c => (
          <div className='staff-lane' key={c.key} style={{ height: GRID_HEIGHT }}
            onClick={e => {
              if (e.target !== e.currentTarget) return;
              const minute = DAY_START + Math.floor((e.nativeEvent.offsetY / PX) / 30) * 30;
              if (c.date > now.date || (c.date === now.date && minute >= now.minutes - 30)) onCreate(c.staff.id, c.date, minute);
            }}>
            {offHours(c.staff.id, c.date).map(g => (
              <div key={g.from} className='off-hours' style={{ top: (g.from - DAY_START) * PX, height: (g.to - g.from) * PX }}>{g.label}</div>
            ))}
            {c.date === now.date && now.minutes > DAY_START && now.minutes < DAY_END && (
              <div className='now-line' style={{ top: (now.minutes - DAY_START) * PX }} />
            )}
            {!loading && bookings.filter(b => b.staff === c.staff.id && b.date === c.date).map(b => (
              <button key={b.id}
                className={`appointment${b.service === BLOCK ? ' blocked' : ''}${matches(b) ? '' : ' dimmed'}`}
                style={{ top: (b.start - DAY_START) * PX, height: b.duration * PX - 6, background: c.staff.color + '15', borderLeftColor: c.staff.color, color: c.staff.color }}
                onClick={() => onSelect(b)}>
                <span>{time(b.start)} – {time(b.start + b.duration)}{b.source === 'online' && <Globe size={11} aria-label='Marcada online' />}</span>
                <strong>{b.name}</strong>
                <small>{serviceName(b.service)}</small>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekMatrix({ days, people, bookings, loading, onDay, onSelect }: {
  days: string[];
  people: Staff[];
  bookings: Booking[];
  loading: boolean;
  onDay: (d: string) => void;
  onSelect: (b: Booking) => void;
}) {
  return (
    <div className='calendar-scroll' aria-busy={loading}>
      <div className='week-matrix' style={{ gridTemplateColumns: `170px repeat(7, minmax(120px,1fr))` }}>
        <div className='wm-corner' />
        {days.map(d => (
          <button key={d} className={`wm-day${d === today() ? ' current-day' : ''}`} onClick={() => onDay(d)}>
            <strong className='capitalize'>{dateLabel(d, { weekday: 'short', day: 'numeric' })}</strong>
          </button>
        ))}
        {people.map(s => (
          <div className='wm-row' key={s.id}>
            <div className='wm-staff'>
              <span className='avatar' style={{ background: s.color + '18', color: s.color }}>{initials(s.name)}</span>
              <div><strong>{s.name}</strong><small>{s.role}</small></div>
            </div>
            {days.map(d => {
              const items = bookings.filter(b => b.staff === s.id && b.date === d);
              const closed = !staffHours(s.id, d).length;
              return (
                <div key={d} className={`wm-cell${closed ? ' closed' : ''}`}>
                  {loading ? null : closed && !items.length ? <small>Folga</small>
                    : items.map(b => (
                      <button key={b.id} className={`wm-item${b.service === BLOCK ? ' blocked' : ''}`} style={{ borderLeftColor: s.color }} onClick={() => onSelect(b)}>
                        <span>{time(b.start)}</span> {b.name}
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
