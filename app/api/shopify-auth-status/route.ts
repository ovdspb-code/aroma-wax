import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/password";
import { getOptionalServerEnv, getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CheckStatus = "ok" | "missing" | `http_${number}` | "graphql_error";

type GraphqlPayload = {
  data?: unknown;
  errors?: Array<{ message?: string }>;
};

async function checkGraphql(domain: string, accessToken: string): Promise<CheckStatus> {
  const response = await fetch(`https://${domain}/admin/api/2026-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query: "query { shop { name } }" }),
    cache: "no-store",
  });

  if (!response.ok) {
    return `http_${response.status}`;
  }

  const payload = (await response.json()) as GraphqlPayload;

  if (payload.errors?.length) {
    return "graphql_error";
  }

  return "ok";
}

export async function GET() {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domain = getServerEnv("SHOPIFY_STORE_DOMAIN");
  const staticToken = getOptionalServerEnv("SHOPIFY_ACCESS_TOKEN");
  const clientId = getOptionalServerEnv("SHOPIFY_CLIENT_ID");
  const clientSecret = getOptionalServerEnv("SHOPIFY_CLIENT_SECRET");

  let staticGraphql: CheckStatus = staticToken ? "missing" : "missing";
  let clientCredentialsToken: CheckStatus = clientId && clientSecret ? "missing" : "missing";
  let freshGraphql: CheckStatus = clientId && clientSecret ? "missing" : "missing";

  if (staticToken) {
    staticGraphql = await checkGraphql(domain, staticToken);
  }

  if (clientId && clientSecret) {
    const tokenResponse = await fetch(`https://${domain}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      clientCredentialsToken = `http_${tokenResponse.status}`;
    } else {
      clientCredentialsToken = "ok";
      const payload = (await tokenResponse.json()) as { access_token?: string };

      if (payload.access_token) {
        freshGraphql = await checkGraphql(domain, payload.access_token);
      } else {
        freshGraphql = "graphql_error";
      }
    }
  }

  return NextResponse.json({
    hasStaticToken: Boolean(staticToken),
    hasClientCredentials: Boolean(clientId && clientSecret),
    staticGraphql,
    clientCredentialsToken,
    freshGraphql,
  });
}
