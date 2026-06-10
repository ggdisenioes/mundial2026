import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.APIFOOTBALL_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, reason: "Sin API key configurada" });
  }
  try {
    const res = await fetch("https://v3.football.api-sports.io/status", {
      headers: { "x-apisports-key": key },
      next: { revalidate: 0 },
    });
    const data = await res.json();
    if (!res.ok || !data.response) {
      return NextResponse.json({ ok: false, reason: "Key inválida o sin acceso" });
    }
    const req = data.response.requests;
    return NextResponse.json({
      ok: true,
      plan: data.response.subscription?.plan ?? "Free",
      used: req?.current ?? 0,
      limit: req?.limit_day ?? 100,
      remaining: (req?.limit_day ?? 100) - (req?.current ?? 0),
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "Error de conexión" });
  }
}
