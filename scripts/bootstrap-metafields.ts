import { z } from "zod";

const envSchema = z.object({
  SHOPIFY_STORE_DOMAIN: z.string().min(1),
  SHOPIFY_ACCESS_TOKEN: z.string().min(1).optional(),
  SHOPIFY_CLIENT_ID: z.string().min(1).optional(),
  SHOPIFY_CLIENT_SECRET: z.string().min(1).optional(),
});

const definitions = [
  {
    key: "template_type",
    name: "Template Type",
    type: "single_line_text_field",
    description: "CLP label template type",
  },
  {
    key: "signal_word",
    name: "Signal Word",
    type: "single_line_text_field",
    description: "Warning or Danger",
  },
  {
    key: "contains",
    name: "Contains",
    type: "json",
    description: "List of contains statements",
  },
  {
    key: "h_statements",
    name: "H Statements",
    type: "json",
    description: "Hazard statements list",
  },
  {
    key: "p_statements",
    name: "P Statements",
    type: "json",
    description: "Precautionary statements list",
  },
  {
    key: "euh_statements",
    name: "EUH Statements",
    type: "json",
    description: "Additional statements list",
  },
  {
    key: "pictograms",
    name: "Pictograms",
    type: "json",
    description: "List of GHS pictogram codes",
  },
  {
    key: "net_quantity_default",
    name: "Net Quantity Default",
    type: "single_line_text_field",
    description: "Default label quantity",
  },
  {
    key: "extra_warning",
    name: "Extra Warning",
    type: "multi_line_text_field",
    description: "Additional CLP warning text",
  },
] as const;

async function getAccessToken(env: z.infer<typeof envSchema>) {
  if (env.SHOPIFY_ACCESS_TOKEN) {
    return env.SHOPIFY_ACCESS_TOKEN;
  }

  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
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

  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

async function createDefinition(
  storeDomain: string,
  accessToken: string,
  ownerType: "PRODUCT" | "PRODUCTVARIANT",
  definition: (typeof definitions)[number],
) {
  const mutation = `
    mutation MetafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await fetch(`https://${storeDomain}/admin/api/2026-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        definition: {
          name: definition.name,
          namespace: "clp",
          key: definition.key,
          description: definition.description,
          type: definition.type,
          ownerType,
        },
      },
    }),
  });

  const payload = (await response.json()) as {
    data?: {
      metafieldDefinitionCreate?: {
        createdDefinition?: { id: string; name: string };
        userErrors?: Array<{ message: string }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  const userErrors = payload.data?.metafieldDefinitionCreate?.userErrors ?? [];

  if (userErrors.length) {
    const message = userErrors.map((error) => error.message).join(", ");
    if (!message.toLowerCase().includes("already exists")) {
      throw new Error(message);
    }
  }

  console.log(`Processed ${ownerType} metafield clp.${definition.key}`);
}

async function main() {
  const env = envSchema.parse(process.env);
  const accessToken = await getAccessToken(env);

  for (const ownerType of ["PRODUCT", "PRODUCTVARIANT"] as const) {
    for (const definition of definitions) {
      await createDefinition(env.SHOPIFY_STORE_DOMAIN, accessToken, ownerType, definition);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
