import { cancelBooking, clientCanCancel, getBookingByToken } from '../../../lib/server/bookings';
import { HttpError, json, readJson, route } from '../../../lib/server/http';
import { notify } from '../../../lib/server/notify';

async function find(token: unknown) {
  const booking = typeof token === 'string' && token.length > 10 ? await getBookingByToken(token) : null;
  if (!booking) throw new HttpError(404, 'Marcação não encontrada. Verifique o link recebido.');
  return booking;
}

const view = (b: Awaited<ReturnType<typeof find>>) => ({
  date: b.date, start: b.start, duration: b.duration, service: b.service, staff: b.staff, name: b.name,
  status: b.status, canCancel: clientCanCancel(b),
});

/** A cliente consulta a sua marcação através do link recebido. */
export const GET = route(async request => {
  return json({ booking: view(await find(new URL(request.url).searchParams.get('token'))) });
});

/** A cliente cancela a sua marcação. */
export const POST = route(async request => {
  const body = await readJson<{ token: string }>(request);
  const booking = await find(body.token);
  if (!clientCanCancel(booking)) throw new HttpError(400, 'Já não é possível cancelar online. Por favor contacte o salão.');
  await cancelBooking(booking.id);
  await notify('cancelled', booking);
  return json({ booking: { ...view(booking), status: 'cancelled', canCancel: false } });
});
