// Guards SUPA.sql against regressions (audit P0-1): the file went 0-byte once
// and lost the entire tenancy layer. Fails if the canonical DDL is missing any
// security-critical construct.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const file = join(root, 'SUPA.sql')

let sql = ''
try {
  sql = readFileSync(file, 'utf8')
} catch {
  console.error('check-supa-sql: SUPA.sql missing')
  process.exit(1)
}

const required = [
  'ENABLE ROW LEVEL SECURITY',
  'can_access_store',
  'claim_store_sync',
  'is_superadmin',
  'create_store_pairing',
  'PRIMARY KEY (id, store_id)',
]

const missing = required.filter((needle) => !sql.includes(needle))

if (sql.trim().length < 1000) {
  console.error(`check-supa-sql: SUPA.sql suspiciously small (${sql.length} bytes)`)
  process.exit(1)
}
if (missing.length > 0) {
  console.error(`check-supa-sql: SUPA.sql missing required constructs: ${missing.join(', ')}`)
  process.exit(1)
}

console.log('check-supa-sql: OK')
