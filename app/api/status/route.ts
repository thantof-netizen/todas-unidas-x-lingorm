import { NextResponse } from "next/server";
import { getD1Binding } from "../../../db/index";

export async function GET() {
  const geminiConnected = Boolean(process.env.GEMINI_API_KEY);
  const databaseConnected = Boolean(process.env.DATABASE_URL || getD1Binding());
  return NextResponse.json({
    ready: geminiConnected && databaseConnected,
    gemini: geminiConnected ? "connected" : "backup-mode",
    database: databaseConnected ? "connected" : "device-only",
    duplicateProtection: true,
    limits: {
      perMinute: Number(process.env.MINUTE_REQUEST_LIMIT || 8),
      perDay: Number(process.env.DAILY_REQUEST_LIMIT || 80),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
