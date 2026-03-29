import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  SHOPIFY_STORE_DOMAIN: z.string().min(1),
  SHOPIFY_ACCESS_TOKEN: z.string().min(1).optional(),
  SHOPIFY_CLIENT_ID: z.string().min(1).optional(),
  SHOPIFY_CLIENT_SECRET: z.string().min(1).optional(),
});

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | undefined;

let envLoaded = false;

type AccessTokenMode = "default" | "fresh";

function applyEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function ensureLocalEnvLoaded() {
  if (envLoaded) {
    return;
  }

  const cwd = process.cwd();
  applyEnvFile(path.join(cwd, ".env"));
  applyEnvFile(path.join(cwd, ".env.local"));
  envLoaded = true;
}

export function getScriptEnv() {
  ensureLocalEnvLoaded();
  return envSchema.parse(process.env);
}

export async function getAccessToken() {
  return getAccessTokenForMode("default");
}

async function getAccessTokenForMode(mode: AccessTokenMode) {
  const env = getScriptEnv();

  if (mode === "default" && env.SHOPIFY_ACCESS_TOKEN) {
    return env.SHOPIFY_ACCESS_TOKEN;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
    if (env.SHOPIFY_ACCESS_TOKEN) {
      return env.SHOPIFY_ACCESS_TOKEN;
    }

    throw new Error(
      "Set SHOPIFY_ACCESS_TOKEN or both SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.",
    );
  }

  const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed with ${response.status}`);
  }

  const payload = (await response.json()) as TokenResponse;

  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };

  return payload.access_token;
}

export async function shopifyAdminFetch<T>(query: string, variables?: Record<string, unknown>) {
  const env = getScriptEnv();
  let accessToken = await getAccessToken();
  let response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 401) {
    cachedToken = undefined;
    const refreshedToken = await getAccessTokenForMode("fresh");

    if (refreshedToken !== accessToken) {
      accessToken = refreshedToken;
      response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query, variables }),
      });
    }
  }

  if (!response.ok) {
    throw new Error(`Shopify GraphQL request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  if (!payload.data) {
    throw new Error("Shopify GraphQL response did not include data.");
  }

  return payload.data;
}
