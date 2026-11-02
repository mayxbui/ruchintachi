CREATE TABLE `streak_repairs` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `streak_repairs_user_date_uq` ON `streak_repairs` (`user_id`,`date`);