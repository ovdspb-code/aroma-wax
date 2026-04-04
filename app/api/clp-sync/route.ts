import { NextRequest, NextResponse } from "next/server";
import { hasAccess } from "@/lib/password";
import { syncClpFromTableForSku } from "@/lib/clp-sync-import";

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

    const result = await syncClpFromTableForSku(sku);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    const isAuthIssue =
      message.includes("Shopify token request failed") ||
      message.includes("Shopify GraphQL request failed with 401") ||
      message.includes("Invalid API key or access token");

    return NextResponse.json(
      {
        error: isAuthIssue
          ? "Shopify write auth is unavailable on this deployment right now. Please refresh deployment credentials before syncing."
          : message,
      },
      { status: isAuthIssue ? 503 : 500 },
    );
  }
}
