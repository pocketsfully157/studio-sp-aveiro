'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, CalendarX } from 'lucide-react';
import { bookingRules, findService, findStaff, salon } from '../../lib/config';
import { dateLabel, time } from '../../lib/time';
import { api } from '../modal';
import Link from 'next/link';

type View = { date: string; start: number; duration: number; service: string; staff: string; name: string; status: string; canCancel: boolean };

export function ManageBooking({ token }: { token: string }) {
  const [booking, setBooking] = useState<View | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ booking: View }>(`/api/manage?token=${encodeURIComponent(token)}`).then(r => setBooking(r.booking)).catch(e => setError(e.message));
  }, [token]);

  async function cancel() {
    if (!confirm('Tem a certeza que quer cancelar esta marcação?')) return;
    setBusy(true);
    setError('');
    try {
      setBooking((await api<{ booking: View }>('/api/manage', { token })).booking);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const cancelled = booking?.status === 'cancelled';
  return (
    <main className='auth-page'>
      <div className='auth-card'>
        <Link className='brand' href='/'>STUDIO <strong>SP</strong><small>{salon.tagline.toUpperCase()}</small></Link>
        {!booking ? (
          error ? <p className='form-error' role='alert'>{error}</p> : <p className='modal-intro'>A carregar…</p>
        ) : (
          <div className='confirmation'>
            {cancelled ? <CalendarX size={34} strokeWidth={1.3} /> : <CalendarCheck size={34} strokeWidth={1.3} />}
            <h1>{cancelled ? 'Marcação cancelada' : `Olá, ${booking.name.split(' ')[0]}.`}</h1>
            <p><strong>{findService(booking.service)?.name}</strong> com {findStaff(booking.staff)?.name}</p>
            <p className={`confirmation-when capitalize${cancelled ? ' struck' : ''}`}>{dateLabel(booking.date)} · {time(booking.start)}</p>
            <p className='modal-intro'>{salon.address}</p>
            {error && <p className='form-error' role='alert'>{error}</p>}
            {cancelled ? (
              <Link className='primary wide' href='/'>Fazer nova marcação</Link>
            ) : booking.canCancel ? (
              <button className='cancel-booking' disabled={busy} onClick={cancel}>{busy ? 'A cancelar…' : 'Cancelar marcação'}</button>
            ) : (
              <p className='fine-print'>Faltam menos de {bookingRules.cancelNoticeHours} h. Para alterar ou cancelar, ligue para <a className='inline' href={`tel:${salon.phone.replace(/\s/g, '')}`}>{salon.phone}</a>.</p>
            )}
            {!cancelled && <p className='fine-print'>Para mudar a data ou hora, cancele e faça nova marcação, ou contacte-nos.</p>}
          </div>
        )}
      </div>
    </main>
  );
}
