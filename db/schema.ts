import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  staff: text('staff').notNull(),
  service: text('service').notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  notes: text('notes').notNull().default(''),
  start: integer('start').notNull(),
  duration: integer('duration').notNull(),
  status: text('status').notNull().default('confirmed'),
  source: text('source').notNull().default('staff'),
  manageToken: text('manage_token').unique(),
  consentAt: text('consent_at'),
  reminderSentAt: text('reminder_sent_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, t => [
  index('booking_day_staff').on(t.date, t.staff),
  index('booking_status_date').on(t.status, t.date),
]);

/** Uma linha por cada meia hora ocupada; a chave única impede marcações sobrepostas. */
export const slots = sqliteTable('slots', {
  key: text('key').primaryKey(),
  bookingId: text('booking_id').notNull(),
}, t => [index('slots_booking').on(t.bookingId)]);

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  /** 'owner' gere tudo; 'staff' só vê e gere a própria agenda. */
  role: text('role').notNull(),
  staffId: text('staff_id'),
  passwordHash: text('password_hash').notNull(),
  active: integer('active').notNull().default(1),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: integer('locked_until'),
  createdAt: text('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  /** SHA-256 do token do cookie (o token em si nunca é guardado). */
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, t => [index('sessions_user').on(t.userId)]);
