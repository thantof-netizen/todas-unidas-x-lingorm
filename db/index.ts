import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type D1Binding = Parameters<typeof drizzle>[0];

export function getD1Binding() {
  return (globalThis as typeof globalThis & { __SITE_D1_DB?: D1Binding }).__SITE_D1_DB;
}

export function getDb() {
  const binding = getD1Binding();
  if (!binding) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(binding, { schema });
}
