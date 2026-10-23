// Envio de avisos às clientes por email (Resend) e SMS/WhatsApp (Twilio).
// Cada canal só é usado se as respetivas chaves estiverem configuradas; sem
// chaves, as mensagens são apenas escritas no registo (útil em desenvolvimento).
import { env } from 'cloudflare:workers';
import { findStaff, notificationSettings, salon } from '../config';
import { serviceName, type Booking } from '../schedule';
import { dateLabel, time } from '../time';

export type NoticeKind = 'confirmed' | 'rescheduled' | 'cancelled' | 'reminder';

type Notifiable = Booking & { manageToken: string | null };

const subjects: Record<NoticeKind, string> = {
  confirmed: 'Marcação confirmada',
  rescheduled: 'Marcação alterada',
  cancelled: 'Marcação cancelada',
  reminder: 'Lembrete da sua marcação',
};

function compose(kind: NoticeKind, b: Notifiable) {
  const when = `${dateLabel(b.date)} às ${time(b.start)}`;
  const who = findStaff(b.staff)?.name.split(' ')[0] ?? '';
  const what = `${serviceName(b.service)}${who ? ` com ${who}` : ''}`;
  const link = b.manageToken ? `${env.SITE_URL.replace(/\/$/, '')}/marcacao/${b.manageToken}` : '';
  const first = b.name.split(' ')[0];
  const lead = {
    confirmed: `A sua marcação no ${salon.name} está confirmada.`,
    rescheduled: `A sua marcação no ${salon.name} foi alterada.`,
    cancelled: `A sua marcação no ${salon.name} foi cancelada.`,
    reminder: `Lembramos a sua marcação no ${salon.name}.`,
  }[kind];

  const sms = kind === 'cancelled'
    ? `${salon.name}: marcação de ${when} cancelada. Para remarcar: ${env.SITE_URL}`
    : `${salon.name}: ${what}, ${when}. ${salon.address}.${link ? ` Gerir: ${link}` : ''}`;

  const lines = [
    `Olá ${first},`,
    '',
    lead,
    '',
    `${what}`,
    `${when}`,
    `${salon.address}`,
    '',
    ...(link && kind !== 'cancelled' ? [`Para ver ou cancelar a marcação: ${link}`, ''] : []),
    `Qualquer dúvida, contacte-nos: ${salon.phone}`,
    '',
    salon.name,
  ];
  return { subject: `${subjects[kind]} · ${salon.name}`, text: lines.join('\n'), sms };
}

async function sendEmail(to: string, subject: string, text: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text, reply_to: salon.email }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return true;
}

async function sendText(to: string, body: string) {
  const whatsapp = notificationSettings.textChannel === 'whatsapp';
  const from = whatsapp ? env.TWILIO_WHATSAPP_FROM : env.TWILIO_SMS_FROM;
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !from) return false;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: whatsapp ? `whatsapp:${from}` : from,
      To: whatsapp ? `whatsapp:${to}` : to,
      Body: body,
    }),
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
  return true;
}

/** Envia o aviso pelos canais disponíveis. Nunca lança erro: uma falha de envio não pode estragar a marcação. */
export async function notify(kind: NoticeKind, b: Notifiable) {
  if (b.status === 'blocked') return;
  const msg = compose(kind, b);
  const results = await Promise.allSettled([
    b.email ? sendEmail(b.email, msg.subject, msg.text) : Promise.resolve(false),
    b.phone ? sendText(b.phone, msg.sms) : Promise.resolve(false),
  ]);
  results.forEach(r => r.status === 'rejected' && console.error('Falha no envio de aviso:', r.reason));
  const sent = results.some(r => r.status === 'fulfilled' && r.value);
  if (!sent) console.log(`[aviso não enviado — sem fornecedor configurado] ${kind} → ${b.email || b.phone}\n${msg.text}`);
  return sent;
}
