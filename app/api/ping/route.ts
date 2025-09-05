import { NextResponse } from "next/server";

// Forza Next a trattarla come funzione server
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true });
}
