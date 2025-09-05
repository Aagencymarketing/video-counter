import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET /api/clients?search=&all=0|1
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = (url.searchParams.get("search") || "").trim();
  const all = url.searchParams.get("all") === "1";

  const where = [];
  const params: any[] = [];
  if (!all) where.push(`active = true`);
  if (search) {
    params.push(`%${search}%`);
    where.push(`name ILIKE $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await sql/* sql */`
    SELECT external_id, name, videos_available, status, last_pub_date, active
    FROM public.clients
    ${sql.unsafe(whereSql, params)}
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

  const body = await req.json().catch(() => ({}));
  const externalId = String(body.externalId || "").trim();
  const name = String(body.name || "").trim();
  const initial = Number.isFinite(body.initialVideos) ? Math.max(0, body.initialVideos) : 0;
  const startAt = body.startAt ? new Date(body.startAt) : null;

  if (!externalId || !name) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  // upsert idempotente
  await sql.begin(async (trx) => {
    const exists = await trx/* sql */`
      SELECT 1 FROM public.clients WHERE external_id = ${externalId} LIMIT 1
    `;
    if (exists.length) {
      await trx/* sql */`
        UPDATE public.clients
        SET name = ${name},
            active = true,
            videos_available = ${initial},
            status = ${initial >= 6 ? "coperto" : "non coperto"},
            ${startAt ? sql`start_at = ${startAt}` : sql``}
        WHERE external_id = ${externalId}
      `;
    } else {
      await trx/* sql */`
        INSERT INTO public.clients (external_id, name, videos_available, status, start_at, active)
        VALUES (${externalId}, ${name}, ${initial}, ${initial >= 6 ? "coperto" : "non coperto"}, ${startAt || new Date()}, true)
      `;
    }
  });

  return NextResponse.json({ ok: true });
}
