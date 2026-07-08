import { getSupabase } from '#/lib/supabase'

export interface PendingPairing {
  pairingCode: string
  label: string | null
  expiresAt: string
}

export async function createStorePairing(label?: string): Promise<string> {
  const { data, error } = await getSupabase().rpc('create_store_pairing', {
    p_label: label?.trim() || null,
  })
  if (error) throw error
  return parseCode(data, 'create_store_pairing')
}

export async function ensureStorePairingCode(): Promise<string> {
  const { data, error } = await getSupabase().rpc('ensure_store_pairing')
  if (error) throw error
  return parseCode(data, 'ensure_store_pairing')
}

export async function listPendingPairings(): Promise<PendingPairing[]> {
  const { data, error } = await getSupabase().rpc('list_pending_pairings')
  if (error) throw error
  if (!Array.isArray(data)) return []
  return data.map((row) => {
    const r = row as Record<string, unknown>
    return {
      pairingCode: String(r.pairing_code ?? ''),
      label: r.label != null ? String(r.label) : null,
      expiresAt: String(r.expires_at ?? ''),
    }
  })
}

function parseCode(data: unknown, rpc: string): string {
  if (typeof data !== 'string' || !data.trim()) {
    throw new Error(`${rpc} returned no code`)
  }
  return data.trim()
}
