import { NextResponse } from "next/server";
import { getProject } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = getProject((await params).id);
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(p);
}
