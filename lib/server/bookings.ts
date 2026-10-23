import { bookingRules, findService, findStaff, notificationSettings } from '../config';
import { BLOCK, clashes, fitsDay, fitsWorkingHours, freeStarts, onlineWindowError, type Booking, type Busy } from '../schedule';
import { absoluteMinutes, isIsoDate, salonNow } from '../time';
import { db, HttpError, randomToken } from './http';
import { isEmail, normalizeEmail } from './auth';

type Row = {
  id: string; date: string; staff: string; service: string; name: string; phone: string; email: string; notes: string;
  start: number; duration: number; status: Booking['status']; source: Booking['source']; manage_token: string | null;
  consent_at: string | null; reminder_sent_at: string | null; created_at: string; updated_at: string;
};

export type StoredBooking = Booking & { manageToken: string | null; reminderSentAt: string | null };

const toBooking = (r: Row): StoredBooking => ({
  id: r.id, date: r.date, staff: r.staff, service: r.service, name: r.name, phone: r.phone, email: r.email, notes: r.notes,
  start: r.start, duration: r.duration, status: r.status, source: r.source, createdAt: r.created_at,
  manageToken: r.manage_token, reminderSentAt: r.reminder_sent_at,
});

/** Remove campos internos antes de enviar para o browser. */
export function publicFields(b: StoredBooking): Booking {
  const { manageToken, reminderSentAt, ...rest } = b;
  void manageToken;
  void reminderSentAt;
  return rest;
}

export async function listBookings(from: string, to: string, staffIds: string[] | null) {
  if (staffIds && !staffIds.length) return [];
  const filter = staffIds ? ` AND staff IN (${staffIds.map(() => '?').join(',')})` : '';
  const { results } = await db()
    .prepare(`SELECT * FROM bookings WHERE date >= ? AND date <= ? AND status != 'cancelled'${filter} ORDER BY date, start`)
    .bind(from, to, ...(staffIds ?? []))
    .all<Row>();
  return results.map(toBooking);
}

export async function busyOn(date: string): Promise<Busy[]> {
  const { results } = await db()
    .prepare("SELECT id, staff, start, duration, status FROM bookings WHERE date = ? AND status != 'cancelled'")
    .bind(date)
    .all<Busy>();
  return results;
}

export async function getBooking(id: string) {
  const row = await db().prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<Row>();
  return row ? toBooking(row) : null;
}

export async function getBookingByToken(token: string) {
  const row = await db().prepare('SELECT * FROM bookings WHERE manage_token = ?').bind(token).first<Row>();
  return row ? toBooking(row) : null;
}

const slotKeys = (b: Pick<Booking, 'date' | 'staff' | 'start' | 'duration'>) =>
  Array.from({ length: b.duration / bookingRules.slotMinutes }, (_, i) => `${b.date}|${b.staff}|${b.start + i * bookingRules.slotMinutes}`);

export function normalizePhone(input: unknown) {
  if (typeof input !== 'string') return '';
  let p = input.replace(/[\s().-]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (p && !p.startsWith('+')) p = notificationSettings.defaultCountryCode + p;
  return p;
}
const isPhone = (p: string) => /^\+\d{9,15}$/.test(p);

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export type BookingInput = {
  id?: string; date: string; staff: string; service: string; start: number; duration?: number;
  name: string; phone?: string; email?: string; notes?: string;
};

/**
 * Valida e guarda uma marcação (nova ou alterada) de forma atómica.
 * `online` aplica as regras do site público; caso contrário são regras da equipa.
 */
export async function saveBooking(input: Partial<BookingInput>, opts: { online: boolean; consent?: boolean }) {
  const now = salonNow();
  const isBlock = input.service === BLOCK;
  const service = isBlock ? null : findService(String(input.service));
  const date = input.date;
  const start = input.start;
  const staffId = String(input.staff ?? '');

  if (!isIsoDate(date)) throw new HttpError(400, 'Data inválida.');
  if (!isBlock && !service) throw new HttpError(400, 'Escolha um serviço.');
  if (!Number.isInteger(start) || (start as number) % bookingRules.slotMinutes) throw new HttpError(400, 'Escolha um horário.');
  if (date < now.date) throw new HttpError(400, 'Não é possível marcar em datas passadas.');

  const duration = isBlock ? Number(input.duration) : service!.duration;
  if (!Number.isInteger(duration) || duration < bookingRules.slotMinutes || duration % bookingRules.slotMinutes || duration > 1440) {
    throw new HttpError(400, 'Duração inválida.');
  }

  const name = text(input.name, 80) || (isBlock ? 'Indisponível' : '');
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const notes = text(input.notes, 500);
  if (!name) throw new HttpError(400, 'Indique o nome.');
  if (phone && !isPhone(phone)) throw new HttpError(400, 'Número de telemóvel inválido.');
  if (email && !isEmail(email)) throw new HttpError(400, 'Email inválido.');

  const existing = input.id ? await getBooking(input.id) : null;
  if (input.id && (!existing || existing.status === 'cancelled')) throw new HttpError(404, 'Marcação não encontrada.');
  const busy = await busyOn(date);

  let chosenStaff = staffId;
  if (opts.online) {
    if (!phone) throw new HttpError(400, 'Indique um telemóvel para podermos confirmar a marcação.');
    if (!opts.consent) throw new HttpError(400, 'É necessário aceitar a Política de Privacidade.');
    const windowError = onlineWindowError(date, start!, now);
    if (windowError) throw new HttpError(400, windowError);
    const working = service!.staff.some(p => (staffId === 'any' || p === staffId) && fitsWorkingHours(p, date, start!, duration));
    if (!working) throw new HttpError(400, 'O salão está fechado neste dia ou horário.');
    // "Qualquer profissional": escolhe quem estiver livre a essa hora.
    const free = freeStarts({ date, serviceId: service!.id, staffId: staffId === 'any' ? undefined : staffId, busy, online: true, now })
      .find(f => f.start === start);
    if (!free) throw new HttpError(409, 'Este horário acabou de ficar ocupado. Escolha outro.');
    chosenStaff = free.staff[0];
  } else {
    if (!findStaff(chosenStaff)) throw new HttpError(400, 'Profissional inválido.');
    if (service && !service.staff.includes(chosenStaff)) throw new HttpError(400, 'Este profissional não faz este serviço.');
    const fits = isBlock ? fitsDay(chosenStaff, date, start!, duration) : fitsWorkingHours(chosenStaff, date, start!, duration);
    if (!fits) throw new HttpError(400, 'Fora do horário de trabalho deste profissional.');
    if (date === now.date && start! + duration <= now.minutes && !existing) throw new HttpError(400, 'Este horário já passou.');
    if (clashes(busy, chosenStaff, start!, duration, existing?.id)) throw new HttpError(409, 'Já existe uma marcação nesse horário.');
  }

  const stamp = new Date().toISOString();
  const booking: StoredBooking = {
    id: existing?.id ?? crypto.randomUUID(),
    date, staff: chosenStaff, service: isBlock ? BLOCK : service!.id, name, phone, email, notes,
    start: start!, duration,
    status: isBlock ? 'blocked' : 'confirmed',
    source: existing?.source ?? (opts.online ? 'online' : 'staff'),
    createdAt: existing?.createdAt ?? stamp,
    manageToken: existing?.manageToken ?? (isBlock ? null : randomToken(24)),
    reminderSentAt: existing && existing.date === date && existing.start === start ? existing.reminderSentAt : null,
  };

  const d = db();
  const commands = [
    ...(existing ? [d.prepare('DELETE FROM slots WHERE booking_id = ?').bind(existing.id)] : []),
    d.prepare(`INSERT INTO bookings (id, date, staff, service, name, phone, email, notes, start, duration, status, source,
        manage_token, consent_at, reminder_sent_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET date = excluded.date, staff = excluded.staff, service = excluded.service,
        name = excluded.name, phone = excluded.phone, email = excluded.email, notes = excluded.notes,
        start = excluded.start, duration = excluded.duration, status = excluded.status,
        reminder_sent_at = excluded.reminder_sent_at, updated_at = excluded.updated_at`)
      .bind(booking.id, booking.date, booking.staff, booking.service, booking.name, booking.phone, booking.email, booking.notes,
        booking.start, booking.duration, booking.status, booking.source, booking.manageToken,
        opts.consent ? stamp : null, booking.reminderSentAt, booking.createdAt, stamp),
    ...slotKeys(booking).map(k => d.prepare('INSERT INTO slots (key, booking_id) VALUES (?, ?)').bind(k, booking.id)),
  ];
  try {
    await d.batch(commands);
  } catch (e) {
    if (String(e).includes('UNIQUE')) throw new HttpError(409, 'Este horário acabou de ficar ocupado. Escolha outro.');
    throw e;
  }
  return { booking, previous: existing };
}

export async function cancelBooking(id: string) {
  const existing = await getBooking(id);
  if (!existing || existing.status === 'cancelled') throw new HttpError(404, 'Marcação não encontrada.');
  const stamp = new Date().toISOString();
  await db().batch([
    db().prepare("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?").bind(stamp, id),
    db().prepare('DELETE FROM slots WHERE booking_id = ?').bind(id),
  ]);
  return existing;
}

/** Se a cliente ainda pode cancelar pelo link (até X horas antes). */
export function clientCanCancel(b: Booking, now = salonNow()) {
  return b.status === 'confirmed' &&
    absoluteMinutes(b.date, b.start) - absoluteMinutes(now.date, now.minutes) >= bookingRules.cancelNoticeHours * 60;
}
