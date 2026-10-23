// Dados do salão. Tudo o que o salão pode querer mudar (equipa, serviços,
// preços, horários, feriados e regras de marcação) está neste ficheiro.
// Os valores atuais são PROVISÓRIOS e devem ser substituídos pelos reais.

/** Intervalos de trabalho em minutos desde a meia-noite, ex.: [[540, 780]] = 09:00–13:00. */
export type Intervals = [number, number][];
/** Horário semanal indexado pelo dia da semana (0 = domingo … 6 = sábado). */
export type WeeklyHours = Record<number, Intervals>;

export type Staff = {
  id: string;
  name: string;
  role: string;
  color: string;
  /** Horário próprio; se omitido, usa o horário do salão. */
  hours?: WeeklyHours;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  /** Duração em minutos (múltiplo de `slotMinutes`). */
  duration: number;
  /** Preço em euros. */
  price: number;
  /** Texto a mostrar quando o preço varia, ex.: "desde 35 €". */
  priceNote?: string;
  staff: string[];
};

const h = (hh: number, mm = 0) => hh * 60 + mm;
const morning: [number, number] = [h(9), h(13)];
const afternoon: [number, number] = [h(14), h(19)];

export const salon = {
  name: 'STUDIO SP',
  tagline: 'Beauty & Wellness · Aveiro',
  address: 'Av. Santa Joana 16, 3810-329 Aveiro',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=STUDIO+SP+Av.+Santa+Joana+16+Aveiro',
  phone: '+351 234 000 000',
  email: 'geral@studiosp.pt',
  instagram: '',
  /** Entidade responsável pelos dados pessoais (Política de Privacidade). */
  legalName: 'STUDIO SP, Unipessoal Lda.',
  nif: '000000000',
  timeZone: 'Europe/Lisbon',
};

/** Horário de abertura do salão. Domingo e segunda fechado. */
export const openingHours: WeeklyHours = {
  0: [],
  1: [],
  2: [morning, afternoon],
  3: [morning, afternoon],
  4: [morning, afternoon],
  5: [morning, afternoon],
  6: [[h(9), h(14)]],
};

/** Dias em que o salão está fechado (feriados, férias), formato AAAA-MM-DD. */
export const closedDates: string[] = [
  // Feriados nacionais e municipal de Aveiro (12 de maio), 2026–2027.
  '2026-10-05', '2026-11-01', '2026-12-01', '2026-12-08', '2026-12-25',
  '2027-01-01', '2027-03-26', '2027-03-28', '2027-04-25', '2027-05-01',
  '2027-05-12', '2027-05-27', '2027-06-10', '2027-08-15', '2027-10-05',
  '2027-11-01', '2027-12-01', '2027-12-08', '2027-12-25',
];

export const bookingRules = {
  /** Granularidade da agenda. */
  slotMinutes: 30,
  /** Antecedência mínima para marcações online. */
  minNoticeMinutes: 120,
  /** Até quantos dias no futuro se aceita marcar online. */
  maxDaysAhead: 60,
  /** A cliente pode cancelar pelo link até X horas antes. */
  cancelNoticeHours: 24,
  /** Enviar lembrete X horas antes da marcação. */
  reminderHoursBefore: 24,
};

export const notificationSettings = {
  /** Canal para mensagens de texto: 'sms' ou 'whatsapp'. */
  textChannel: 'sms' as 'sms' | 'whatsapp',
  /** Indicativo usado quando a cliente escreve o número sem indicativo. */
  defaultCountryCode: '+351',
};

export const staff: Staff[] = [
  { id: 'sofia', name: 'Sofia Martins', role: 'Cabelo', color: '#785373' },
  { id: 'beatriz', name: 'Beatriz Costa', role: 'Cabelo', color: '#916346' },
  { id: 'ines', name: 'Inês Silva', role: 'Manicura', color: '#456c75' },
  { id: 'mariana', name: 'Mariana Santos', role: 'Estética e massagens', color: '#63704a' },
];

export const services: Service[] = [
  { id: 'corte', name: 'Corte e brushing', category: 'Cabelo', duration: 60, price: 35, staff: ['sofia', 'beatriz'] },
  { id: 'cor', name: 'Coloração e brushing', category: 'Cabelo', duration: 120, price: 65, priceNote: 'desde 65 €', staff: ['sofia', 'beatriz'] },
  { id: 'gel', name: 'Manicura gel', category: 'Manicura', duration: 60, price: 25, staff: ['ines'] },
  { id: 'facial', name: 'Ritual de rosto', category: 'Estética', duration: 60, price: 45, staff: ['mariana'] },
  { id: 'massagem', name: 'Massagem relaxante', category: 'Massagens', duration: 60, price: 50, staff: ['mariana'] },
];

export const categories = [...new Set(services.map(s => s.category))];

export const findStaff = (id: string) => staff.find(s => s.id === id);
export const findService = (id: string) => services.find(s => s.id === id);
