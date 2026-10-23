import { saveBooking, type BookingInput } from '../../../lib/server/bookings';
import { json, readJson, route } from '../../../lib/server/http';
import { notify } from '../../../lib/server/notify';

/** Marcação feita pela cliente no site. */
export const POST = route(async request => {
  const body = await readJson<BookingInput & { consent: boolean; website: string }>(request);
  // Campo escondido: só robôs o preenchem.
  if (body.website) return json({ ok: true });
  const { booking } = await saveBooking(body, { online: true, consent: body.consent === true });
  await notify('confirmed', booking);
  return json({
    booking: { date: booking.date, start: booking.start, service: booking.service, staff: booking.staff, name: booking.name },
    manageUrl: `/marcacao/${booking.manageToken}`,
  });
});
