import { salon } from './config';

/** Data e minutos atuais na hora de Lisboa (independente do fuso do servidor/browser). */
export function salonNow(at = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: salon.timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(at).map(p => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export const today = () => salonNow().date;

export const isIsoDate = (d: unknown): d is string =>
  typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + 'T12:00:00Z'));

/** Dias desde 1970-01-01 para uma data AAAA-MM-DD (para comparar e somar datas sem fusos). */
export const dayNumber = (d: string) => Math.round(Date.parse(d + 'T00:00:00Z') / 86_400_000);

export function addDays(d: string, n: number) {
  return new Date((dayNumber(d) + n) * 86_400_000).toISOString().slice(0, 10);
}

export const weekday = (d: string) => new Date(d + 'T12:00:00Z').getUTCDay();

/** Segunda-feira da semana que contém `d`. */
export const weekStart = (d: string) => addDays(d, -((weekday(d) + 6) % 7));

/** Minutos absolutos (hora local do salão) para comparar datas+horas. */
export const absoluteMinutes = (date: string, minutes: number) => dayNumber(date) * 1440 + minutes;

export const time = (n: number) =>
  `${Math.floor(n / 60).toString().padStart(2, '0')}:${(n % 60).toString().padStart(2, '0')}`;

export const dateLabel = (d: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('pt-PT', { ...opts, timeZone: 'UTC' });
