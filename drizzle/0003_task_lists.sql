CREATE TABLE `task_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `task_lists_user_idx` ON `task_lists` (`user_id`);--> statement-breakpoint
ALTER TABLE `habits` ADD `list_id` text REFERENCES task_lists(id);