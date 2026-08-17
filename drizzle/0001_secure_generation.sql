ALTER TABLE `generated_messages` ADD `trend_id` text NOT NULL DEFAULT 'legacy';
CREATE INDEX `generated_messages_trend_language_idx` ON `generated_messages` (`trend_id`,`language`);
CREATE TABLE `generation_requests` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `visitor_hash` text NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `generation_requests_visitor_created_idx` ON `generation_requests` (`visitor_hash`,`created_at`);
