import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/shopify";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") ?? "";

  try {
    const products = await searchProducts(search);
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown Shopify error",
      },
      { status: 500 },
    );
  }
}
