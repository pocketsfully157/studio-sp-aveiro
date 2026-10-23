'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { findService, services, staff as allStaff } from '../../lib/config';
import { BLOCK, candidateStarts, clashes, dayBounds, fitsDay, type Booking } from '../../lib/schedule';
import type { User } from '../../lib/server/auth';
import { dateLabel, salonNow, time, today } from '../../lib/time';
import { api, Modal } from '../modal';

export type EditorTarget = { booking?: Booking; block?: boolean; staffId?: string; date?: string; start?: number };

const BLOCK_DURATIONS = [30, 60, 90, 120, 180, 240, 300, 480, 600];

export function BookingEditor({ target, user, onClose, onSaved }: {
  target: EditorTarget;
  user: User;
  onClose: () => void;
  onSaved: (message: string, date?: string) => void;
}) {
  const original = target.booking;
  const isBlock = original ? original.service === BLOCK : !!target.block;
  const manageable = allStaff.filter(s => user.role === 'owner' || s.id === user.staffId);
  const firstServiceFor = (staffId?: string) => services.find(s => !staffId || s.staff.includes(staffId)) ?? services[0];

  const [serviceId, setServiceId] = useState(isBlock ? BLOCK : original?.service ?? firstServiceFor(target.staffId).id);
  const [staffId, setStaffId] = useState(original?.staff ?? target.staffId ?? manageable[0]?.id ?? '');
  const [date, setDate] = useState(original?.date ?? target.date ?? today());
  const [start, setStart] = useState<number | null>(original?.start ?? target.start ?? null);
  const [blockDuration, setBlockDuration] = useState(isBlock ? original?.duration ?? 60 : 60);
  const [form, setForm] = useState({
    name: original?.name ?? '', phone: original?.phone ?? '', email: original?.email ?? '', notes: original?.notes ?? '',
  });
  const [notifyClient, setNotifyClient] = useState(true);
  const [day, setDay] = useState<{ date: string; busy?: Booking[]; error?: string }>({ date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const service = findService(serviceId);
  const duration = isBlock ? blockDuration : service?.duration ?? 60;
  const staffChoices = manageable.filter(s => isBlock || service?.staff.includes(s.id));
  const busy = day.date === date ? day.busy : undefined;
  const now = salonNow();

  useEffect(() => {
    let alive = true;
    api<{ bookings: Booking[] }>(`/api/admin/bookings?from=${date}&to=${date}`)
      .then(r => alive && setDay({ date, busy: r.bookings }))
      .catch(e => alive && setDay({ date, error: e.message }));
    return () => { alive = false; };
  }, [date]);

  let starts: number[] = [];
  if (busy) {
    const raw = isBlock
      ? (() => { const b = dayBounds(staffId, date); return b ? Array.from({ length: (b[1] - b[0]) / 30 }, (_, i) => b[0] + i * 30) : []; })()
      : candidateStarts(staffId, date, duration);
    starts = raw.filter(s =>
      (!isBlock || fitsDay(staffId, date, s, duration)) &&
      !clashes(busy, staffId, s, duration, original?.id) &&
      (date > now.date || s + duration > now.minutes || s === original?.start));
  }
  const validStart = start !== null && starts.includes(start);
  const hasContact = !!(form.phone.trim() || form.email.trim());

  async function send(action: 'save' | 'cancel') {
    if (action === 'cancel' && !confirm(isBlock ? 'Remover este bloqueio?' : 'Cancelar esta marcação?')) return;
    setSaving(true);
    setError('');
    try {
      await api('/api/admin/bookings', {
        action, id: original?.id, service: serviceId, staff: staffId, date, start, duration, ...form,
        notifyClient: notifyClient && hasContact,
      });
      onSaved(action === 'cancel'
        ? (isBlock ? 'Bloqueio removido.' : 'Marcação cancelada.')
        : isBlock ? 'Horário bloqueado.' : original ? 'Marcação atualizada.' : 'Marcação criada.', date);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  const title = isBlock ? (original ? 'Bloqueio de horário' : 'Bloquear horário') : original ? 'Marcação' : 'Nova marcação';

  return (
    <Modal open onClose={onClose} label={title} eyebrow={original?.source === 'online' ? 'MARCADA ONLINE PELA CLIENTE' : 'AGENDA'}>
      <form onSubmit={e => { e.preventDefault(); send('save'); }}>
        <h2>{title}</h2>
        {original && !isBlock && (form.phone || form.email) && (
          <div className='contact-links'>
            {form.phone && <a href={`tel:${form.phone}`}><Phone size={15} /> {form.phone}</a>}
            {form.email && <a href={`mailto:${form.email}`}><Mail size={15} /> {form.email}</a>}
          </div>
        )}
        {!isBlock && (
          <label>Serviço
            <select value={serviceId} onChange={e => {
              const next = findService(e.target.value)!;
              setServiceId(next.id);
              if (!next.staff.includes(staffId)) setStaffId(manageable.find(s => next.staff.includes(s.id))?.id ?? staffId);
            }}>
              {services.filter(s => manageable.some(m => s.staff.includes(m.id))).map(s => (
                <option key={s.id} value={s.id}>{s.name} · {s.duration} min · {s.price} €</option>
              ))}
            </select>
          </label>
        )}
        <div className='form-grid'>
          <label>Profissional
            <select value={staffId} onChange={e => setStaffId(e.target.value)} disabled={staffChoices.length < 2}>
              {staffChoices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>Data<input type='date' required min={original && original.date < today() ? original.date : today()} value={date} onChange={e => e.target.value && setDate(e.target.value)} /></label>
        </div>
        {isBlock && (
          <label>Duração
            <select value={blockDuration} onChange={e => setBlockDuration(Number(e.target.value))}>
              {BLOCK_DURATIONS.map(n => <option value={n} key={n}>{n < 60 ? `${n} minutos` : `${n / 60} h`.replace('.5', ',5')}</option>)}
            </select>
          </label>
        )}
        <label>Início <span className='optional'>· {dateLabel(date, { weekday: 'long', day: 'numeric', month: 'short' })}</span></label>
        <div className='slots'>
          {day.date === date && day.error ? <p role='alert'>{day.error}</p>
            : !busy ? <p>A consultar a agenda…</p>
            : !starts.length ? <p>Sem horários livres neste dia para {duration} min.</p>
            : starts.map(s => <button type='button' key={s} className={start === s ? 'chosen' : ''} onClick={() => setStart(s)}>{time(s)}</button>)}
        </div>

        <label>{isBlock ? 'Motivo' : 'Nome da cliente'}
          <input maxLength={80} required={!isBlock} placeholder={isBlock ? 'Pausa, formação, férias…' : ''} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </label>
        {!isBlock && (
          <>
            <div className='form-grid'>
              <label>Telemóvel<input type='tel' value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
              <label>Email<input type='email' value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            </div>
            <label>Observações<textarea rows={2} maxLength={500} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
            <label className='check'>
              <input type='checkbox' checked={notifyClient && hasContact} disabled={!hasContact} onChange={e => setNotifyClient(e.target.checked)} />
              <span>Avisar a cliente {original ? 'se a data ou hora mudar' : 'com a confirmação'}</span>
            </label>
          </>
        )}

        {error && <p className='form-error' role='alert'>{error}</p>}
        <div className='booking-summary'>
          <span>{start !== null ? `${time(start)} – ${time(start + duration)}` : 'Escolha a hora'} · {duration} min</span>
          {service && <strong>{service.price} €</strong>}
        </div>
        <button className='primary wide' disabled={saving || !validStart}>{saving ? 'A guardar…' : original ? 'Guardar alterações' : isBlock ? 'Bloquear' : 'Criar marcação'}</button>
        {original && (
          <button className='cancel-booking' type='button' disabled={saving} onClick={() => send('cancel')}>
            {isBlock ? 'Remover bloqueio' : 'Cancelar marcação'}
          </button>
        )}
      </form>
    </Modal>
  );
}
