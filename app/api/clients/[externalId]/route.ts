import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: { externalId: string }}) {
  const key = req.headers.get("x-api-key");
  if (key !== process.env.X_API_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const id = params.externalId?.trim();
  if (!id) return NextResponse.json({ ok:false, error:"missing id" }, { status:400 });

  await sql/* sql */`
    UPDATE public.clients
    SET active = false
    WHERE external_id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
