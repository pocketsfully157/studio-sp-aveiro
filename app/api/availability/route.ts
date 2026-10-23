import { bookingRules, findService } from '../../../lib/config';
import { freeStarts } from '../../../lib/schedule';
import { addDays, isIsoDate, salonNow } from '../../../lib/time';
import { busyOn } from '../../../lib/server/bookings';
import { HttpError, json, route } from '../../../lib/server/http';

/** Horários livres para o site público. Não devolve dados de clientes. */
export const GET = route(async request => {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const serviceId = url.searchParams.get('service') ?? '';
  const staffId = url.searchParams.get('staff');
  const now = salonNow();
  if (!isIsoDate(date)) throw new HttpError(400, 'Data inválida.');
  if (!findService(serviceId)) throw new HttpError(400, 'Serviço inválido.');
  if (date < now.date || date > addDays(now.date, bookingRules.maxDaysAhead)) return json({ slots: [] });
  const slots = freeStarts({
    date, serviceId, staffId: staffId && staffId !== 'any' ? staffId : undefined,
    busy: await busyOn(date), online: true, now,
  });
  return json({ slots });
});
