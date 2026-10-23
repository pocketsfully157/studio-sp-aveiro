CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`staff` text NOT NULL,
	`service` text NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`start` integer NOT NULL,
	`duration` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`source` text DEFAULT 'staff' NOT NULL,
	`manage_token` text,
	`consent_at` text,
	`reminder_sent_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_manage_token_unique` ON `bookings` (`manage_token`);--> statement-breakpoint
CREATE INDEX `booking_day_staff` ON `bookings` (`date`,`staff`);--> statement-breakpoint
CREATE INDEX `booking_status_date` ON `bookings` (`status`,`date`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `slots` (
	`key` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `slots_booking` ON `slots` (`booking_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`staff_id` text,
	`password_hash` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`failed_logins` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);