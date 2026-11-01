import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const base = (req.nextUrl.searchParams.get("base") ?? "INR").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "INR";
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`rates ${res.status}`);
    const data = await res.json();
    if (data.result !== "success") throw new Error("rates provider error");
    const wanted = ["INR", "USD", "EUR", "GBP", "JPY", "IDR", "AED", "SGD"];
    const rates: Record<string, number> = {};
    wanted.forEach((c) => {
      if (data.rates?.[c]) rates[c] = data.rates[c];
    });
    return NextResponse.json({
      base,
      rates,
      updated: data.time_last_update_utc,
      attribution: "Exchange rates by open.er-api.com",
    });
  } catch {
    return NextResponse.json(
      {
        base,
        rates: { INR: 1, USD: 0.0119, EUR: 0.011, GBP: 0.0094, JPY: 1.79, IDR: 189.5, AED: 0.0437, SGD: 0.016 },
        updated: null,
        attribution: "Fallback indicative rates",
        fallback: true,
      },
      { status: 200 }
    );
  }
}
