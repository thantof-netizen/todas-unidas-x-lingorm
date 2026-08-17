import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const generatedMessages = sqliteTable("generated_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  body: text("body").notNull(),
  normalizedBody: text("normalized_body").notNull(),
  language: text("language").notNull(),
  tone: text("tone").notNull(),
  protagonist: text("protagonist").notNull(),
  trendId: text("trend_id").notNull().default("legacy"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("generated_messages_normalized_unique").on(table.normalizedBody),
  index("generated_messages_created_at_idx").on(table.createdAt),
  index("generated_messages_trend_language_idx").on(table.trendId, table.language),
]);
