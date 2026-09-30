CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`staff` text NOT NULL,
	`service` text NOT NULL,
	`name` text NOT NULL,
	`start` integer NOT NULL,
	`duration` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `booking_day_staff` ON `bookings` (`date`,`staff`);--> statement-breakpoint
CREATE TABLE `seeded` (
	`date` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`key` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL
);
