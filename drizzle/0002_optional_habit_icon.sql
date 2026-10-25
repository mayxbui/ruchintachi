PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_habits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`note` text,
	`start_date` text NOT NULL,
	`frequency` text NOT NULL,
	`weekdays` text,
	`end_type` text DEFAULT 'never' NOT NULL,
	`end_date` text,
	`end_count` integer,
	`previous_habit_id` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_habits`("id", "user_id", "name", "icon", "note", "start_date", "frequency", "weekdays", "end_type", "end_date", "end_count", "previous_habit_id", "created_at") SELECT "id", "user_id", "name", "icon", "note", "start_date", "frequency", "weekdays", "end_type", "end_date", "end_count", "previous_habit_id", "created_at" FROM `habits`;--> statement-breakpoint
DROP TABLE `habits`;--> statement-breakpoint
ALTER TABLE `__new_habits` RENAME TO `habits`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `habits_user_idx` ON `habits` (`user_id`);