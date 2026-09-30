import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const bookings=sqliteTable('bookings',{id:text('id').primaryKey(),date:text('date').notNull(),staff:text('staff').notNull(),service:text('service').notNull(),name:text('name').notNull(),start:integer('start').notNull(),duration:integer('duration').notNull(),status:text('status').notNull().default('confirmed')},t=>[index('booking_day_staff').on(t.date,t.staff)]);
export const slots=sqliteTable('slots',{key:text('key').primaryKey(),bookingId:text('booking_id').notNull()});
export const seeded=sqliteTable('seeded',{date:text('date').primaryKey()});
