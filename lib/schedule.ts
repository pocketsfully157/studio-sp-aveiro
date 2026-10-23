// Regras de horário partilhadas pelo site, pela gestão e pelo servidor.
import { bookingRules, closedDates, findService, findStaff, openingHours, services, type Intervals } from './config';
import { absoluteMinutes, addDays, salonNow, weekday } from './time';

export type BookingStatus = 'confirmed' | 'cancelled' | 'blocked';

export type Booking = {
  id: string;
  date: string;
  staff: string;
  /** Id do serviço, ou 'block' para horários bloqueados. */
  service: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  start: number;
  duration: number;
  status: BookingStatus;
  source: 'online' | 'staff';
  createdAt: string;
};

/** Intervalo ocupado na agenda de um profissional. */
export type Busy = Pick<Booking, 'id' | 'staff' | 'start' | 'duration' | 'status'>;

export const BLOCK = 'block';

export function staffHours(staffId: string, date: string): Intervals {
  if (closedDates.includes(date)) return [];
  const person = findStaff(staffId);
  return (person?.hours ?? openingHours)[weekday(date)] ?? [];
}

/** Primeiro e último minuto de trabalho do profissional nesse dia. */
export function dayBounds(staffId: string, date: string): [number, number] | null {
  const hours = staffHours(staffId, date);
  if (!hours.length) return null;
  return [Math.min(...hours.map(i => i[0])), Math.max(...hours.map(i => i[1]))];
}

export function fitsWorkingHours(staffId: string, date: string, start: number, duration: number) {
  return staffHours(staffId, date).some(([a, b]) => start >= a && start + duration <= b);
}

export function fitsDay(staffId: string, date: string, start: number, duration: number) {
  const bounds = dayBounds(staffId, date);
  return !!bounds && start >= bounds[0] && start + duration <= bounds[1];
}

export const isActive = (b: Pick<Busy, 'status'>) => b.status !== 'cancelled';

export function clashes(busy: Busy[], staffId: string, start: number, duration: number, ignoreId?: string) {
  return busy.some(b => b.id !== ignoreId && isActive(b) && b.staff === staffId && start < b.start + b.duration && start + duration > b.start);
}

/** Motivo pelo qual a data/hora não pode ser marcada online, ou null se pode. */
export function onlineWindowError(date: string, start: number, now = salonNow()) {
  if (date > addDays(now.date, bookingRules.maxDaysAhead)) return `Só é possível marcar online até ${bookingRules.maxDaysAhead} dias de antecedência.`;
  if (absoluteMinutes(date, start) < absoluteMinutes(now.date, now.minutes) + bookingRules.minNoticeMinutes) {
    return 'Este horário já não está disponível para marcação online.';
  }
  return null;
}

/** Inícios possíveis (sem olhar para marcações) dentro do horário de trabalho. */
export function candidateStarts(staffId: string, date: string, duration: number) {
  const starts: number[] = [];
  for (const [a, b] of staffHours(staffId, date)) {
    for (let s = a; s + duration <= b; s += bookingRules.slotMinutes) starts.push(s);
  }
  return starts;
}

export type FreeStart = { start: number; staff: string[] };

/**
 * Horários livres para um serviço. Se `staffId` for omitido, considera todos os
 * profissionais que fazem o serviço e devolve, por hora, quem está livre.
 */
export function freeStarts(opts: {
  date: string;
  serviceId: string;
  staffId?: string;
  busy: Busy[];
  online: boolean;
  ignoreId?: string;
  now?: ReturnType<typeof salonNow>;
}): FreeStart[] {
  const service = findService(opts.serviceId);
  if (!service) return [];
  const people = opts.staffId ? service.staff.filter(s => s === opts.staffId) : service.staff;
  const byStart = new Map<number, string[]>();
  for (const person of people) {
    for (const start of candidateStarts(person, opts.date, service.duration)) {
      if (opts.online && onlineWindowError(opts.date, start, opts.now)) continue;
      if (clashes(opts.busy, person, start, service.duration, opts.ignoreId)) continue;
      byStart.set(start, [...(byStart.get(start) ?? []), person]);
    }
  }
  return [...byStart].sort((a, b) => a[0] - b[0]).map(([start, staff]) => ({ start, staff }));
}

export const serviceName = (id: string) => (id === BLOCK ? 'Horário bloqueado' : findService(id)?.name ?? id);

export const servicesFor = (staffId: string) => services.filter(s => s.staff.includes(staffId));
