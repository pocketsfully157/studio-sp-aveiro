'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Clock } from 'lucide-react';
import { bookingRules, findService, findStaff, services, staff } from '../../lib/config';
import { staffHours, type FreeStart } from '../../lib/schedule';
import { addDays, dateLabel, time, today } from '../../lib/time';
import { api, Modal } from '../modal';

type Confirmation = { booking: { date: string; start: number; service: string; staff: string; name: string }; manageUrl: string };

/** Próximos dias em que o salão está aberto, para escolha rápida. */
function upcomingOpenDays(count: number) {
  const days: string[] = [];
  const first = today();
  for (let i = 0; days.length < count && i <= bookingRules.maxDaysAhead; i++) {
    const d = addDays(first, i);
    if (staff.some(s => staffHours(s.id, d).length)) days.push(d);
  }
  return days;
}

export function BookingDialog({ initialService, onClose }: { initialService?: string; onClose: () => void }) {
  const [serviceId, setServiceId] = useState(initialService ?? services[0].id);
  const [staffId, setStaffId] = useState('any');
  const [quickDays] = useState(() => upcomingOpenDays(10));
  const [date, setDate] = useState(() => quickDays[0] ?? today());
  const [start, setStart] = useState<number | null>(null);
  const [availability, setAvailability] = useState<{ query: string; slots?: FreeStart[]; error?: string }>({ query: '' });
  const [reloads, setReloads] = useState(0);
  const [contact, setContact] = useState({ name: '', phone: '', email: '', notes: '', website: '' });
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Confirmation | null>(null);

  const service = findService(serviceId)!;
  const team = staff.filter(s => service.staff.includes(s.id));
  const query = `date=${date}&service=${serviceId}&staff=${staffId}`;
  const slots = availability.query === query ? availability.slots ?? null : null;
  const slotError = availability.query === query ? availability.error ?? '' : '';

  useEffect(() => {
    let alive = true;
    api<{ slots: FreeStart[] }>(`/api/availability?${query}`)
      .then(r => alive && setAvailability({ query, slots: r.slots }))
      .catch(e => alive && setAvailability({ query, error: e.message }));
    return () => { alive = false; };
  }, [query, reloads]);

  async function submit() {
    if (start === null) return setError('Escolha um horário.');
    setSaving(true);
    setError('');
    try {
      setDone(await api<Confirmation>('/api/bookings', { service: serviceId, staff: staffId, date, start, consent, ...contact }));
    } catch (e) {
      setError((e as Error).message);
      // O horário pode ter sido ocupado entretanto: recarregar a lista.
      setStart(null);
      setReloads(n => n + 1);
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof typeof contact) => ({
    value: contact[key],
    onChange: (e: { target: { value: string } }) => setContact({ ...contact, [key]: e.target.value }),
  });

  if (done) {
    const b = done.booking;
    return (
      <Modal open onClose={onClose} label='Marcação confirmada' eyebrow='MARCAÇÃO CONFIRMADA'>
        <div className='confirmation'>
          <CalendarCheck size={34} strokeWidth={1.3} />
          <h2>Até breve, {b.name.split(' ')[0]}.</h2>
          <p><strong>{findService(b.service)?.name}</strong> com {findStaff(b.staff)?.name}</p>
          <p className='confirmation-when'>{dateLabel(b.date)} · {time(b.start)}</p>
          <p className='modal-intro'>Enviámos os detalhes para o seu contacto. Pode ver ou cancelar a marcação a qualquer momento:</p>
          <a className='primary wide' href={done.manageUrl}>Ver a minha marcação</a>
          <button type='button' className='text-button centered' onClick={onClose}>Fechar</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} label='Marcar no STUDIO SP' eyebrow='MARCAÇÃO ONLINE'>
      <form onSubmit={e => { e.preventDefault(); submit(); }}>
        <h2>Um momento só seu.</h2>
        <label>Serviço
          <select value={serviceId} onChange={e => { setServiceId(e.target.value); setStaffId('any'); setStart(null); }}>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} · {s.duration} min · {s.priceNote ?? `${s.price} €`}</option>)}
          </select>
        </label>
        <label>Profissional
          <select value={staffId} onChange={e => { setStaffId(e.target.value); setStart(null); }}>
            {team.length > 1 && <option value='any'>Qualquer profissional</option>}
            {team.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <label htmlFor='booking-date'>Dia</label>
        <div className='day-chips'>
          {quickDays.map(d => (
            <button type='button' key={d} aria-label={dateLabel(d)} aria-pressed={d === date} className={d === date ? 'chosen' : ''} onClick={() => { setDate(d); setStart(null); }}>
              <small>{dateLabel(d, { weekday: 'short' })}</small>
              <strong>{dateLabel(d, { day: 'numeric' })}</strong>
              <small>{dateLabel(d, { month: 'short' })}</small>
            </button>
          ))}
        </div>
        <input id='booking-date' type='date' aria-label='Outra data' min={today()} max={addDays(today(), bookingRules.maxDaysAhead)}
          value={date} onChange={e => { setDate(e.target.value); setStart(null); }} />

        <label>Horários disponíveis</label>
        <div className='slots' aria-live='polite'>
          {slotError ? <p role='alert'>{slotError}</p>
            : slots === null ? <p>A consultar disponibilidade…</p>
            : slots.length === 0 ? <p>Sem horários livres neste dia. Experimente outro dia{team.length > 1 ? ' ou profissional' : ''}.</p>
            : slots.map(s => (
              <button type='button' key={s.start} className={start === s.start ? 'chosen' : ''} onClick={() => setStart(s.start)}>{time(s.start)}</button>
            ))}
        </div>

        <div className='form-grid'>
          <label>Nome<input required maxLength={80} autoComplete='name' {...field('name')} /></label>
          <label>Telemóvel<input required type='tel' autoComplete='tel' placeholder='912 345 678' {...field('phone')} /></label>
        </div>
        <label>Email <span className='optional'>(opcional, para receber a confirmação)</span>
          <input type='email' autoComplete='email' {...field('email')} />
        </label>
        <label>Observações <span className='optional'>(opcional)</span>
          <textarea rows={2} maxLength={500} placeholder='Ex.: alergias, pedidos especiais' {...field('notes')} />
        </label>
        {/* Campo escondido anti-spam */}
        <input className='hp' tabIndex={-1} autoComplete='off' aria-hidden='true' {...field('website')} />

        <label className='check'>
          <input type='checkbox' required checked={consent} onChange={e => setConsent(e.target.checked)} />
          <span>Aceito que o STUDIO SP use os meus dados para gerir esta marcação, conforme a <a href='/privacidade' target='_blank'>Política de Privacidade</a>.</span>
        </label>

        {error && <p className='form-error' role='alert'>{error}</p>}
        <div className='booking-summary'>
          <Clock size={17} />
          <span>{start !== null ? `${dateLabel(date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${time(start)} · ` : ''}{service.duration} min</span>
          <strong>{service.priceNote ?? `${service.price} €`}</strong>
        </div>
        <button className='primary wide' disabled={saving || start === null}>{saving ? 'A confirmar…' : 'Confirmar marcação'}</button>
        <p className='fine-print'>Pagamento no salão. Pode cancelar até {bookingRules.cancelNoticeHours} h antes pelo link que vai receber.</p>
      </form>
    </Modal>
  );
}
