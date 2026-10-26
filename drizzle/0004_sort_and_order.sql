ALTER TABLE `habits` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `task_sort` text DEFAULT 'next' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `done_last` integer DEFAULT true NOT NULL;