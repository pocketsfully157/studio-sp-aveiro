import { assertCanManage, requireUser, visibleStaff } from '../../../../lib/server/auth';
import { cancelBooking, getBooking, listBookings, publicFields, saveBooking, type BookingInput } from '../../../../lib/server/bookings';
import { HttpError, json, readJson, route } from '../../../../lib/server/http';
import { notify } from '../../../../lib/server/notify';
import { dayNumber, isIsoDate } from '../../../../lib/time';

/** Marcações entre duas datas (inclusive), limitadas às agendas que o utilizador pode ver. */
export const GET = route(async request => {
  const user = await requireUser();
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to') ?? from;
  if (!isIsoDate(from) || !isIsoDate(to) || to < from || dayNumber(to) - dayNumber(from) > 42) {
    throw new HttpError(400, 'Intervalo de datas inválido.');
  }
  const bookings = await listBookings(from, to, visibleStaff(user));
  return json({ bookings: bookings.map(publicFields) });
});

type Body = BookingInput & { action: 'save' | 'cancel'; notifyClient?: boolean };

export const POST = route(async request => {
  const user = await requireUser();
  const body = await readJson<Body>(request);
  const notifyClient = body.notifyClient !== false;

  if (body.id) {
    const existing = await getBooking(body.id);
    if (!existing) throw new HttpError(404, 'Marcação não encontrada.');
    assertCanManage(user, existing.staff);
  }

  if (body.action === 'cancel') {
    if (!body.id) throw new HttpError(400, 'Marcação inválida.');
    const cancelled = await cancelBooking(body.id);
    if (notifyClient) await notify('cancelled', cancelled);
    return json({ ok: true });
  }

  assertCanManage(user, String(body.staff));
  const { booking, previous } = await saveBooking(body, { online: false });
  const moved = previous && (previous.date !== booking.date || previous.start !== booking.start || previous.staff !== booking.staff);
  if (notifyClient && (!previous || moved)) await notify(previous ? 'rescheduled' : 'confirmed', booking);
  return json({ booking: publicFields(booking) });
});
