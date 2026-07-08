# Graph Report - DASHBOARD  (2026-06-25)

## Corpus Check
- 157 files · ~67,759 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 879 nodes · 2222 edges · 34 communities (31 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2659acf0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]

## God Nodes (most connected - your core abstractions)
1. `getSupabase()` - 49 edges
2. `formatMoney()` - 45 edges
3. `fetchDashboard()` - 28 edges
4. `round2()` - 27 edges
5. `Button()` - 19 edges
6. `useAuth()` - 19 edges
7. `useStore()` - 19 edges
8. `FileRoutesByPath` - 18 edges
9. `useRechartsModule()` - 17 edges
10. `DateRange` - 17 edges

## Surprising Connections (you probably didn't know these)
- `signIn()` --calls--> `getSupabase()`  [EXTRACTED]
  src/lib/auth.tsx → src/lib/supabase.ts
- `signUp()` --calls--> `getSupabase()`  [EXTRACTED]
  src/lib/auth.tsx → src/lib/supabase.ts
- `formatAuditDetail()` --calls--> `formatMoney()`  [EXTRACTED]
  src/routes/_app/audit.tsx → src/lib/money.ts
- `SetPasswordFromAuthCallback()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/SetPasswordFromAuthCallback.tsx → src/lib/auth.tsx
- `TrendBadge()` --calls--> `formatMoney()`  [EXTRACTED]
  src/components/dashboard/DashboardPrimitives.tsx → src/lib/money.ts

## Import Cycles
- 1-file cycle: `eslint.config.js -> eslint.config.js`

## Communities (34 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (90): buildDashboardAlerts(), buildRecentActivity(), countInventoryAlerts(), DashboardInventoryHealth, DashboardStockMovementPoint, DashboardStockStatus, inventoryBundleFromProducts(), inventoryKpiPriorCounts() (+82 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (53): CashMovementType, ActivityAlertsSection(), CategoryPerformanceChart(), ChartFrame(), ChartLoading(), DashboardHomeCharts(), DashboardCard(), DashboardEmpty() (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (72): ButtonSize, ButtonVariant, SIZE, Td(), Th(), VARIANT, formatReportNow(), formatReportTimestamp() (+64 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (61): AuditLogAction, auditLogReducer(), AuditLogState, formatAuditDetail(), PAGE_SIZE_OPTIONS, CierresPage(), cachedInventoryTotal(), ReportsPageContent() (+53 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (43): Route, Route, Route, Route, Route, Route, Route, Route (+35 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (28): DashboardI18nSync(), LANGUAGES, LanguageSwitcher(), NotFoundPage(), FormAction, FormState, initialFormState, PagePhase (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (32): inviteErrorKey(), OperatorPortalPage(), resetErrorKey(), LinkPosPage(), Route, StoreClaimCodeCard(), StorePairingList(), Field() (+24 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (32): addBillingInterval(), BILLING_INTERVALS, BillingInterval, isBillingInterval(), toUtcDateKey(), draftFromStore(), isPosOnline(), StoreBillingRow() (+24 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (29): downloadFacturaHtml(), downloadFacturaPdf(), facturaExportFilename(), buildCombinedFacturaHtml(), buildFacturaHtml(), buildFacturaPages(), buildPage(), buildSummaryBlock() (+21 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (26): DashboardTabNav(), TAB_LABEL_KEYS, DashboardTabContent(), buildEmployeeOverviewFromPosUsers(), employeePerformanceFromSales(), EMPTY_DASHBOARD_TEAM, isActivePosUser(), parsePosUserRole() (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (17): AuthedShell(), Route, NoStoresPage(), AppQueryProvider(), AuthContext, AuthProvider(), AuthSlice, AuthSliceAction (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (21): dependencies, exceljs, html2canvas, i18next, jspdf, lucide-react, nitro, react (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (21): devDependencies, eslint, eslint-plugin-react, eslint-plugin-react-compiler, eslint-plugin-react-doctor, eslint-plugin-react-hooks, globals, jsdom (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (14): AppLogo(), ICONS, NavIcon(), NavIconName, PRESENCE_STALE_MS, prefetchDashboard(), isNavItemActive(), navLinkClass() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (11): authorizeCron(), Route, billingRemindersConfigured(), getBillingCronSecret(), getDiscordBillingWebhookUrl(), getSupabaseAnonKey(), getSupabaseSecretKey(), getSupabaseUrl() (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.27
Nodes (10): RelativeTime(), StoreStatusBadge(), StoreStatusDot(), formatRelativeTime(), parseDbTimestamp(), findPresence(), StorePresence, fetchStorePresence() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (10): AuditPage(), DashboardPage(), MovementsPage(), ReportsPage(), Shell(), useStore(), useSidebarCollapsed(), isOperatorPortalPath() (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (10): usernameMapForUserIds(), anonKey, url, CashMovementRow, CierreRow, CashMovementsResult, fetchCashMovements(), CierresOptions (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.27
Nodes (10): isSuperadminUser(), postLoginPath(), isOperatorPath(), resolveStoreId(), StoreContext, StoreContextValue, StoreProvider(), StoreId (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (12): After making React code changes:, Command, Configuring or explaining rules, /doctor — full local triage workflow, For general cleanup or code improvement:, React Doctor, Commands, Config shape (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (9): generateInviteLink(), InviteBody, Route, isValidEmail(), normalizeEmail(), resolveDashboardRedirect(), formatSupabaseAuthError(), isSupabaseEmailDeliveryError() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (11): scripts, build, check, dev, doctor, format, generate-routes, lint (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (9): engines, node, imports, name, pnpm, onlyBuiltDependencies, private, type (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (4): initialLoginFormState, LoginFormAction, LoginFormState, Route

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (5): ignore, include, rules, react-doctor/artifact-baas-authority-surface, $schema

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (5): Deploy (Vercel), Env vars (Vercel), Features, Setup, ShelfPOS Admin Dashboard

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (5): Confirm signup (optional), Invite user, Reset password, Supabase email templates — ShelfPOS, Variables (Supabase Go templates)

### Community 29 - "Community 29"
Cohesion: 0.50
Nodes (3): framework, installCommand, $schema

## Knowledge Gaps
- **235 isolated node(s):** `$schema`, `include`, `ignore`, `react-doctor/artifact-baas-authority-surface`, `reactFiles` (+230 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSupabase()` connect `Community 0` to `Community 3`, `Community 5`, `Community 6`, `Community 10`, `Community 16`, `Community 18`, `Community 19`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `formatMoney()` connect `Community 1` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 3` to `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 25`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `$schema`, `include`, `ignore` to the rest of the system?**
  _235 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.051018465638682654 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05355276907001045 - nodes in this community are weakly interconnected._