CREATE TABLE `coin_ledger` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`reason` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coin_ledger_user_date_reason_uq` ON `coin_ledger` (`user_id`,`date`,`reason`);