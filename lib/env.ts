const requiredServerEnv = ["SHOPIFY_STORE_DOMAIN", "APP_PASSWORD"] as const;

export function getServerEnv(name: (typeof requiredServerEnv)[number]) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getOptionalServerEnv(name: string) {
  return process.env[name]?.trim();
}

export function isMockModeEnabled() {
  return process.env.USE_MOCK_DATA === "1";
}
