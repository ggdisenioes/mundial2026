import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, reason: "Sin API key configurada" });
  }
  try {
    const res = await fetch("https://api.football-data.org/v4/competitions/WC", {
      headers: { "X-Auth-Token": key },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: `Error ${res.status}` });
    }

    const data = await res.json();
    const rpm = res.headers.get("x-requests-available-minute");

    return NextResponse.json({
      ok: true,
      competition: (data as { name?: string }).name ?? "FIFA World Cup",
      rpmAvailable: rpm !== null ? parseInt(rpm) : null,
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "Error de conexión" });
  }
}
