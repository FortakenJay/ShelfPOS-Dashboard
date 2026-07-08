/** Server-only env (Nitro / TanStack server routes). Never prefix with VITE_. */

export function getSupabaseUrl(): string {
  return (
    process.env.VITE_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ''
  )
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    ''
  )
}

/** Supabase secret API key (`sb_secret_…`) — server-only, bypasses RLS. */
export function getSupabaseSecretKey(): string {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ''
  )
}

export function operatorInviteConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseSecretKey())
}

export function getDiscordBillingWebhookUrl(): string {
  return process.env.DISCORD_BILLING_WEBHOOK_URL?.trim() || ''
}

export function getBillingCronSecret(): string {
  return process.env.BILLING_CRON_SECRET?.trim() || ''
}

export function billingRemindersConfigured(): boolean {
  return Boolean(operatorInviteConfigured() && getDiscordBillingWebhookUrl())
}
