function firstValue(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

const fromAstro = {
  SUPABASE_URL: import.meta.env.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.SUPABASE_PUBLISHABLE_KEY,
  R2_ACCOUNT_ID: import.meta.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: import.meta.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: import.meta.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: import.meta.env.R2_BUCKET_NAME,
  R2_PUBLIC_URL: import.meta.env.R2_PUBLIC_URL,
} as const;

type EnvName = keyof typeof fromAstro;

export function requireEnv(name: EnvName): string {
  const value = firstValue(process.env[name], fromAstro[name]);

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}
