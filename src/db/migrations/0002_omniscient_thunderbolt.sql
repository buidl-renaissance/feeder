ALTER TABLE `sources` ADD `refresh_rate` integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE `sources` ADD `last_fetch_attempt` integer;