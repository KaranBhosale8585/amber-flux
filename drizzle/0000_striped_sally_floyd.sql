CREATE TABLE `analysis_results` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`risk` text NOT NULL,
	`confidence` real NOT NULL,
	`missing_items` text NOT NULL,
	`analyzed_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quote_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quote_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`customer` text NOT NULL,
	`project` text NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`estimated_value` real NOT NULL,
	`created_date` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
