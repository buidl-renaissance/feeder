ALTER TABLE `content` ADD `external_id` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `last_error` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `consecutive_failures` integer DEFAULT 0;