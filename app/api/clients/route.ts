import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET /api/clients  → per ora: solo attivi, ordine per nome
export async function GET() {
  const rows = await sql/* sql */`
    SELECT external_id, name, videos_available, status, last_pub_date, active
    FROM public.clients
    WHERE active = true
    ORDER BY name ASC
  `;
  return NextResponse.json({ ok: true, rows });
}

// POST /api/clients  { externalId, name, initialVideos?, startAt? }
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== process.env.X_API_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const externalId = String(body.externalId || "").trim();
  const name = String(body.name || "").trim();
  const initial = Number.isFinite(body.initialVideos) ? Math.max(0, body.initialVideos) : 0;
  const startAt = body.startAt ? new Date(body.startAt) : new Date();
  if (!externalId || !name) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  const status = initial >= 6 ? "coperto" : "non coperto";

  // UPSERT semplice
  await sql/* sql */`
    INSERT INTO public.clients (external_id, name, videos_available, status, start_at, active)
    VALUES (${externalId}, ${name}, ${initial}, ${status}, ${startAt}, true)
    ON CONFLICT (external_id) DO UPDATE SET
      name = EXCLUDED.name,
      videos_available = EXCLUDED.videos_available,
      status = EXCLUDED.status,
      start_at = EXCLUDED.start_at,
      active = true
  `;

  return NextResponse.json({ ok: true });
}
