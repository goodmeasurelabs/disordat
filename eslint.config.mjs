import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  // Keep existing mount-time browser/feedback synchronization visible without
  // changing product behavior as part of the hosting migration.
  { rules: { "react-hooks/set-state-in-effect": "warn" } },
  globalIgnores(['.next/**', '.open-next/**', '.worker-dry-run/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
