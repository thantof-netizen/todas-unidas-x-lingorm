CREATE TABLE `generated_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`body` text NOT NULL,
	`normalized_body` text NOT NULL,
	`language` text NOT NULL,
	`tone` text NOT NULL,
	`protagonist` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `generated_messages_normalized_unique` ON `generated_messages` (`normalized_body`);--> statement-breakpoint
CREATE INDEX `generated_messages_created_at_idx` ON `generated_messages` (`created_at`);