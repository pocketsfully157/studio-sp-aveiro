import { bookingRules } from '../config';
import { absoluteMinutes, addDays, salonNow } from '../time';
import { getBooking } from './bookings';
import { db } from './http';
import { notify } from './notify';

/** Envia lembretes às marcações das próximas X horas que ainda não o receberam. Corre no cron. */
export async function sendDueReminders() {
  const now = salonNow();
  const nowAbs = absoluteMinutes(now.date, now.minutes);
  const window = bookingRules.reminderHoursBefore * 60;
  const { results } = await db()
    .prepare(`SELECT id, date, start, created_at FROM bookings
      WHERE status = 'confirmed' AND reminder_sent_at IS NULL AND date >= ? AND date <= ?`)
    .bind(now.date, addDays(now.date, Math.ceil(bookingRules.reminderHoursBefore / 24) + 1))
    .all<{ id: string; date: string; start: number; created_at: string }>();

  let sent = 0;
  for (const r of results) {
    const at = absoluteMinutes(r.date, r.start);
    if (at <= nowAbs || at - nowAbs > window) continue;
    // Marcações feitas já dentro da janela do lembrete só recebem a confirmação.
    const created = salonNow(new Date(r.created_at));
    if (at - absoluteMinutes(created.date, created.minutes) < window) continue;
    // Marca antes de enviar para que execuções sobrepostas não enviem duas vezes.
    const claim = await db().prepare('UPDATE bookings SET reminder_sent_at = ? WHERE id = ? AND reminder_sent_at IS NULL')
      .bind(new Date().toISOString(), r.id).run();
    if (!claim.meta.changes) continue;
    const booking = await getBooking(r.id);
    if (booking && (await notify('reminder', booking))) sent++;
  }
  return sent;
}
