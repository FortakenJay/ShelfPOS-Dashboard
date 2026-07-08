/** Mirrors POS hidden operator — filter from dashboard reads of pos_users. */
export const HIDDEN_OPERATOR_USERNAME = 'SAKEN'

export function isHiddenOperatorUsername(username: string | null | undefined): boolean {
  return (username ?? '').trim().toLowerCase() === HIDDEN_OPERATOR_USERNAME.toLowerCase()
}
