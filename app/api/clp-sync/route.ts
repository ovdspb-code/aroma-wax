import { NextRequest, NextResponse } from "next/server";
import { hasAccess } from "@/lib/password";
import { syncClpForSku } from "@/lib/clp-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { sku?: string };
    const sku = payload.sku?.trim() ?? "";

    if (!sku) {
      return NextResponse.json({ error: "SKU is required." }, { status: 400 });
    }

    const result = await syncClpForSku(sku);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 500 },
    );
  }
}
