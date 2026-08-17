import { neon } from "@neondatabase/serverless";
import { and, desc, eq, lt } from "drizzle-orm";
import { getD1Binding, getDb } from "./index";
import { generatedMessages } from "./schema";

export type GenerationMetadata = {
  language: string;
  tone: string;
  protagonist: string;
  trendId: string;
};

let neonSchemaReady: Promise<void> | undefined;

function postgres() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

async function ensureNeonSchema() {
  const sql = postgres();
  if (!sql) return;
  neonSchemaReady ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS generated_messages (
      id BIGSERIAL PRIMARY KEY,
      body TEXT NOT NULL,
      normalized_body TEXT NOT NULL,
      language TEXT NOT NULL,
      tone TEXT NOT NULL,
      protagonist TEXT NOT NULL,
      trend_id TEXT NOT NULL DEFAULT 'legacy',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS generated_messages_normalized_unique ON generated_messages (normalized_body)`;
    await sql`CREATE INDEX IF NOT EXISTS generated_messages_trend_language_idx ON generated_messages (trend_id, language, created_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS generation_requests (
      id BIGSERIAL PRIMARY KEY,
      visitor_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS generation_requests_visitor_created_idx ON generation_requests (visitor_hash, created_at DESC)`;
  })();
  await neonSchemaReady;
}

export function normalizeMessage(value: string) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

export async function getRecentGeneratedMessages(limit = 500, language?: string, trendId?: string) {
  const sql = postgres();
  if (sql) {
    await ensureNeonSchema();
    const safeLimit = Math.max(1, Math.min(limit, 500));
    const rows = language && trendId
      ? await sql`SELECT body FROM generated_messages WHERE language = ${language} AND trend_id = ${trendId} ORDER BY created_at DESC LIMIT ${safeLimit}`
      : language
        ? await sql`SELECT body FROM generated_messages WHERE language = ${language} ORDER BY created_at DESC LIMIT ${safeLimit}`
        : await sql`SELECT body FROM generated_messages ORDER BY created_at DESC LIMIT ${safeLimit}`;
    return rows as unknown as { body: string }[];
  }

  const query = getDb().select({ body: generatedMessages.body }).from(generatedMessages);
  return language && trendId
    ? query.where(and(eq(generatedMessages.language, language), eq(generatedMessages.trendId, trendId))).orderBy(desc(generatedMessages.createdAt)).limit(limit)
    : language
      ? query.where(eq(generatedMessages.language, language)).orderBy(desc(generatedMessages.createdAt)).limit(limit)
      : query.orderBy(desc(generatedMessages.createdAt)).limit(limit);
}

export async function rememberGeneratedMessages(messages: string[], metadata: GenerationMetadata) {
  if (!messages.length) return;
  const sql = postgres();
  if (sql) {
    await ensureNeonSchema();
    for (const body of messages) {
      await sql`INSERT INTO generated_messages (body, normalized_body, language, tone, protagonist, trend_id)
        VALUES (${body}, ${normalizeMessage(body)}, ${metadata.language}, ${metadata.tone}, ${metadata.protagonist}, ${metadata.trendId})
        ON CONFLICT (normalized_body) DO NOTHING`;
    }
    await sql`DELETE FROM generated_messages WHERE created_at < NOW() - INTERVAL '90 days'`;
    return;
  }

  await getDb().insert(generatedMessages).values(messages.map((body) => ({
    body,
    normalizedBody: normalizeMessage(body),
    language: metadata.language,
    tone: metadata.tone,
    protagonist: metadata.protagonist,
    trendId: metadata.trendId,
  }))).onConflictDoNothing();
  await getDb().delete(generatedMessages).where(lt(generatedMessages.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)));
}

export async function checkGenerationAllowance(visitorHash: string) {
  const minuteLimit = Math.max(1, Number(process.env.MINUTE_REQUEST_LIMIT || 8));
  const dailyLimit = Math.max(minuteLimit, Number(process.env.DAILY_REQUEST_LIMIT || 80));
  const sql = postgres();
  if (sql) {
    await ensureNeonSchema();
    const counts = await sql`SELECT
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 minute')::int AS minute_count,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS daily_count
      FROM generation_requests WHERE visitor_hash = ${visitorHash}` as unknown as Array<{ minute_count: number; daily_count: number }>;
    const current = counts[0] ?? { minute_count: 0, daily_count: 0 };
    if (current.minute_count >= minuteLimit) return { allowed: false, retryAfter: 60, reason: "minute" as const };
    if (current.daily_count >= dailyLimit) return { allowed: false, retryAfter: 3600, reason: "day" as const };
    await sql`INSERT INTO generation_requests (visitor_hash) VALUES (${visitorHash})`;
    await sql`DELETE FROM generation_requests WHERE created_at < NOW() - INTERVAL '2 days'`;
    return { allowed: true };
  }

  const binding = getD1Binding() as unknown as { prepare(query: string): { bind(...values: unknown[]): { first<T>(): Promise<T | null>; run(): Promise<unknown> } } } | undefined;
  if (!binding) return { allowed: true };
  const now = Date.now();
  const counts = await binding.prepare("SELECT SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) AS minute_count, COUNT(*) AS daily_count FROM generation_requests WHERE visitor_hash = ? AND created_at > ?")
    .bind(now - 60_000, visitorHash, now - 86_400_000).first<{ minute_count: number | null; daily_count: number }>();
  if ((counts?.minute_count ?? 0) >= minuteLimit) return { allowed: false, retryAfter: 60, reason: "minute" as const };
  if ((counts?.daily_count ?? 0) >= dailyLimit) return { allowed: false, retryAfter: 3600, reason: "day" as const };
  await binding.prepare("INSERT INTO generation_requests (visitor_hash, created_at) VALUES (?, ?)").bind(visitorHash, now).run();
  await binding.prepare("DELETE FROM generation_requests WHERE created_at < ?").bind(now - 172_800_000).run();
  return { allowed: true };
}
