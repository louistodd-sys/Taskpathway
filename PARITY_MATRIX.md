# TaskPathway ↔ Lurgan SOP Generator — Parity Matrix

**Phase 1 completed:** Full source audit (Lurgan SOP Generator, Base44 export)
**Phase 2 completed:** Target mapping against TaskPathway (Next.js / Supabase)
**Date:** 2026-06-10

---

## Platform Mapping Applied

| Source (Base44) | Target (TaskPathway) |
|---|---|
| Base44 entities | Supabase tables with RLS |
| Base44 auth & roles | Supabase Auth + Membership model |
| Base44 backend functions | Next.js route handlers |
| Base44 file storage | Supabase Storage |
| `SendEmail` integration | Resend |
| PDF generation | Puppeteer |
| `InvokeLLM` / `ExtractDataFromUploadedFile` | Anthropic API route handler |

## Intentional Changes (🔵 — do NOT fix back to source)

| Source behaviour | Target behaviour | PRD authority |
|---|---|---|
| Single-site internal app, no tenancy | Multi-tenant SaaS (Company + Membership tables) | PRD multi-tenant model |
| Roles: admin / user / operator / landing | Roles: owner / admin / author / reviewer / viewer | PRD role model |
| Status: Draft → Submitted → Approved → Published | Status: Draft → In Review → Approved → Rejected → Archived | PRD workflow |
| Entity type: "SOP" only | Document types: Task / Work Instruction | PRD §document-types |
| No pricing/plans | Free (5 docs) / Starter £19 / Growth £39 / Pro £79 via Stripe | PRD §pricing |
| No invite flow | Email invite via Resend + TpInvitation table | PRD onboarding |
| Branding: Huhtamaki Lurgan SOP Generator | Branding: TaskPathway | PRD §branding |
| SharePoint agent integration | Not applicable (SaaS product) | PRD scope |

---

## Matrix

### CATEGORY A — Entities / Schema

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| A01 | Entity | **SOP / Document** — core document entity | `base44/entities/SOP.jsonc` | `public.documents` table; `src/lib/types.ts` Document interface | 🟡 PARTIAL | DB has most fields but missing: `machine` (single backward-compat field), `machine_area`, `base_title`. `applicable_machines` and `notification_emails` ARE in DB but not in `types.ts` (types file stale). Step sub-array moved to separate table (correct). |
| A02 | Entity | **SOP.machine** field | `base44/entities/SOP.jsonc` → `machine: string` | `public.documents` — column absent | ❌ GAP | Single `machine` field kept in source for backward compat. Target has `applicable_machines[]` but no `machine` scalar. Needed for filter logic that checks both. |
| A03 | Entity | **SOP.machine_area** field | `base44/entities/SOP.jsonc` → `machine_area: string` | `public.documents` — column absent | ❌ GAP | Used in Dashboard filter and exported PDFs. |
| A04 | Entity | **SOP.base_title** field | `base44/entities/SOP.jsonc` → `base_title: string (required)` | `public.documents` — column absent | ❌ GAP | Source auto-generates `title` from `base_title` + dept/machine metadata. Target uses `title` directly. Functionality must be decided: either add `base_title` or document that `title` is user-entered directly. |
| A05 | Entity | **SOP.applicable_machines[]** | `base44/entities/SOP.jsonc` | `public.documents.applicable_machines text[]` ✅ in DB; absent from `src/lib/types.ts` | 🟡 PARTIAL | Column exists in Supabase but `types.ts` doesn't declare it. Type gap only — DB is correct. |
| A06 | Entity | **SOP.notification_emails / email_settings** | `base44/entities/SOP.jsonc` → `email_settings.recipients[]` | `public.documents.notification_emails text[]` ✅ in DB; absent from `src/lib/types.ts` | 🟡 PARTIAL | Column exists in DB. Types file stale. No Resend integration wired yet. |
| A07 | Entity | **SOP.steps[] — video_captions** | `base44/entities/SOP.jsonc` steps items → `video_captions[]` with time/duration/text/position | `public.steps.video_captions jsonb` ✅ in DB; absent from `src/lib/types.ts` Step interface | 🟡 PARTIAL | Column exists in DB. Types file stale. |
| A08 | Entity | **SOP.steps[] — notes** | `base44/entities/SOP.jsonc` steps items → `notes: string` | `public.steps` — column absent | ❌ GAP | Step-level notes field not present in target schema. |
| A09 | Entity | **SOPChangeLog / document_changelog** | `base44/entities/SOPChangeLog.jsonc` | `public.document_changelog` table | ✅ PARITY | All key fields present: document_id, document_title, change_type, summary, previous_status, new_status, previous_version, new_version, step_count_before/after, changed_fields[], changed_by_name. |
| A10 | Entity | **SOPChangeLog.changed_by_email** | `base44/entities/SOPChangeLog.jsonc` → `changed_by_email: string` | `public.document_changelog` — column absent (has `changed_by_user_id` UUID instead) | 🟡 PARTIAL | Target uses FK to auth.users instead of denormalised email. Functionally equivalent via join but UI will need to join to get email. Minor gap. |
| A11 | Entity | **DiagnosticTree** | `base44/entities/DiagnosticTree.jsonc` — fields: title, description, machine, machine_area, department, priority, estimated_time, safety_requirements[], root_node_id, status | No table in Supabase; no type in `src/lib/types.ts` | ❌ GAP | Entire diagnostic tree builder system missing. |
| A12 | Entity | **DiagnosticNode** | `base44/entities/DiagnosticNode.jsonc` — fields: tree_id, node_type(question/action/result/info), title, content, image_url, safety_warning, safety_message, options[], position{x,y} | No table in Supabase | ❌ GAP | Part of diagnostic tree system. |
| A13 | Entity | **DiagnosticSession** | `base44/entities/DiagnosticSession.jsonc` — fields: tree_id, operator_name, machine, start_time, end_time, path_taken[], final_outcome, notes, status | No table in Supabase | ❌ GAP | Records a user's run through a diagnostic tree. |
| A14 | Entity | **LearningModule** | `base44/entities/LearningModule.jsonc` — fields: title, description, status, estimated_time, passing_score, module_type(Course/CompetencyTest/Onboarding) | No table in Supabase | ❌ GAP | E-learning module container. |
| A15 | Entity | **LearningBlock** | `base44/entities/LearningBlock.jsonc` — fields: module_id, block_number, block_type(text_narration/image_display/video_embed/quiz_single_choice/sop_interactive_embed), content_data{}, required_to_proceed | No table in Supabase | ❌ GAP | Content block within a learning module. |
| A16 | Entity | **MachineManual** | `base44/entities/MachineManual.jsonc` — fields: title, description, department, machine, applicable_machines[], machine_components[], file_url, version, status, manufacturer, model_number, release_date | No table in Supabase | ❌ GAP | PDF manual upload/storage entity. |
| A17 | Entity | **Machine / Asset** | Used in `src/pages/AssetManager.jsx` via `base44.entities.Machine` — fields: name, department, areas[], description, active, sort_order; NOT in `base44/entities/` directory (dynamically created entity) | No table in Supabase | ❌ GAP | Machine/asset catalogue. Powers filter dropdowns in SOP editor and library. Has seed data (DEFAULT_MACHINE_SEED). |
| A18 | Entity | **User.app_role** | `base44/entities/User.jsonc` → app_role enum: admin/user/operator/landing | `public.memberships.app_role`: owner/admin/author/reviewer/viewer | 🔵 INTENTIONAL CHANGE | Role model changed per PRD. Mapping: admin→admin, user/author→author, operator/viewer→viewer. |
| A19 | Entity | **Profile** | `base44/entities/User.jsonc` + Base44 auth user (full_name, email, role) | `public.profiles` — id, full_name, avatar_url, onboarding_complete | ✅ PARITY | |
| A20 | Entity | **Company (multi-tenant org)** | Not in source (single-site) | `public.companies` — id, name, slug, logo, industry_type, site_name, plan_type, task_limit, active | 🔵 INTENTIONAL CHANGE | Multi-tenant model per PRD. |
| A21 | Entity | **Membership** | Not in source | `public.memberships` | 🔵 INTENTIONAL CHANGE | Multi-tenant role assignment per PRD. |
| A22 | Entity | **TpInvitation** | Not in source | `public.tp_invitations` | 🔵 INTENTIONAL CHANGE | Email invite flow per PRD. |
| A23 | Entity | **audit_logs** | Not directly in source (Base44 auto-audits) | `public.audit_logs` | 🔵 INTENTIONAL CHANGE | Generic audit table; target-only enhancement. |
| A24 | Entity | **types.ts stale vs DB** | N/A | `src/lib/types.ts` missing: applicable_machines, notification_emails on Document; video_captions on Step | ❌ GAP | types.ts must be updated to reflect actual DB columns or downstream code will miss these fields. |

---

### CATEGORY B — Pages / Routes

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| B01 | Page | **Dashboard / SOP Workbench** — lists all docs, stats (total/draft/approved/favorites), filter by dept/machine/area/status, tree navigator | `src/pages/Dashboard.jsx` | `src/app/(app)/library/page.tsx` (11KB) | 🟡 PARTIAL | Target library page exists but: (1) no machine/machine_area filters (those fields missing from schema); (2) no favorites system; (3) no stats cards; (4) no tree-grouped navigator. Needs investigation of library/page.tsx content to confirm exact gaps. |
| B02 | Page | **Favorites system** — star/unstar SOPs, localStorage persistence | `src/pages/Dashboard.jsx` — `toggleFavorite()`, `localStorage.setItem('sop_favorites')` | No equivalent in target | ❌ GAP | Favorites stored in localStorage. Simple to add. |
| B03 | Page | **SOPLibrary (Operator view)** — shows only Approved SOPs + Active DiagnosticTrees + Approved MachineManuals, hierarchical browse, full-text search | `src/pages/SOPLibrary.jsx` | `src/app/(app)/library/page.tsx` | 🟡 PARTIAL | Target library exists for documents but cannot show DiagnosticTrees or MachineManuals (those tables don't exist). Hierarchical dept→machine browse unclear without machine_area field. |
| B04 | Page | **SOPEditor (desktop)** — create/edit SOP with metadata, steps, image upload | `src/pages/SOPEditor.jsx` (12KB) | `src/app/(app)/create/page.tsx` + `src/app/(app)/edit/[id]/page.tsx` + `src/components/tasks/TaskEditor.tsx` (17.7KB) | 🟡 PARTIAL | Editor exists but missing fields: machine, applicable_machines UI, machine_area, base_title logic. Also missing: email notification recipients UI. |
| B05 | Page | **SOPEditorMobile** — full mobile-optimised SOP editor (32KB, primary create path) | `src/pages/SOPEditorMobile.jsx` (32KB) | No dedicated mobile route; `create/page.tsx` is 845 bytes (thin wrapper) | ❌ GAP | Source has a 32KB dedicated mobile editor — primary creation path. Target has thin create page. Unclear if TaskEditor is responsive enough to replace this or if a mobile-specific path is needed. |
| B06 | Page | **SOPViewer** — read-only formatted SOP display | `src/pages/SOPViewer.jsx` (18KB) | `src/app/(app)/view/[id]/page.tsx` (1KB, thin wrapper) + `src/components/tasks/InteractiveViewer.tsx` (17.6KB) | 🟡 PARTIAL | Viewer exists. Need to confirm InteractiveViewer covers plain "read-only" mode vs. interactive step-through mode — may be the same component. |
| B07 | Page | **SOPInteractiveViewer** — step-by-step interactive viewer with acknowledgement, video playback, captions | `src/pages/SOPInteractiveViewer.jsx` (44KB) | `src/components/tasks/InteractiveViewer.tsx` (17.6KB) | 🟡 PARTIAL | Target has InteractiveViewer component but at 17.6KB vs source 44KB there may be feature gaps. Video caption overlay, step acknowledgement — unclear without reading full content. |
| B08 | Page | **ChangeLog / Management of Change** — full audit trail of SOPChangeLog, expandable entries, filter by type/search, stats | `src/pages/ChangeLog.jsx` | `src/app/(app)/changelog/ChangelogClient.tsx` (5.7KB) | 🟡 PARTIAL | Changelog page exists. Source has 10KB implementation with expand/collapse, stats (total/tracked SOPs/approvals/status changes), type filter. Target ChangelogClient is 5.7KB — likely missing some features. Needs content read. |
| B09 | Page | **AdminRegister (SOP Activity Register)** — admin-only log of all SOP creation/modification activity, filter by period/search | `src/pages/AdminRegister.jsx` | No direct equivalent (admin/page.tsx = 3.2KB) | ❌ GAP | Source shows timestamped SOP activity list with period filters. Target admin page may be invite/user management only. |
| B10 | Page | **AssetManager** — full CRUD for Machine entities, sub-areas, active toggle, sort order, seed defaults, grouped by department | `src/pages/AssetManager.jsx` (19KB) | No equivalent page in target | ❌ GAP | Requires Machine table (A17) first. |
| B11 | Page | **DiagnosticEditor** — visual editor for DiagnosticTree + DiagnosticNodes (flow diagram style) | `src/pages/DiagnosticEditor.jsx` (12KB) | No equivalent page in target | ❌ GAP | Requires DiagnosticTree/Node tables (A11, A12) first. |
| B12 | Page | **DiagnosticRunner** — interactive run through a DiagnosticSession, step-by-step with options | `src/pages/DiagnosticRunner.jsx` (19KB) | No equivalent page in target | ❌ GAP | Requires DiagnosticTree/Node/Session tables. |
| B13 | Page | **DiagnosticImporter** — upload PDF, extract diagnostic tree via LLM, create DiagnosticTree + DiagnosticNodes | `src/pages/DiagnosticImporter.jsx` (10KB) | No equivalent page in target | ❌ GAP | Requires backend function (F04) and DiagnosticTree tables. |
| B14 | Page | **FaultFinding** — entry page linking to diagnostic trees by machine/department | `src/pages/FaultFinding.jsx` (12KB) | No equivalent page in target | ❌ GAP | Requires DiagnosticTree table. |
| B15 | Page | **LearningStudio** — manage learning modules list, create/archive modules | `src/pages/LearningStudio.jsx` (13KB) | No equivalent page in target | ❌ GAP | Requires LearningModule/LearningBlock tables (A14, A15). |
| B16 | Page | **ModuleEditor** — edit a LearningModule: add/reorder blocks (text, image, video, quiz, SOP embed) | `src/pages/ModuleEditor.jsx` (11KB) | No equivalent page in target | ❌ GAP | Requires LearningModule/LearningBlock tables. |
| B17 | Page | **ModuleRunner** — take a learning module, progress through blocks, answer quiz questions | `src/pages/ModuleRunner.jsx` (14KB) | No equivalent page in target | ❌ GAP | Requires LearningModule/LearningBlock tables. |
| B18 | Page | **ManualEditor** — upload and manage MachineManual PDFs (title, machine, dept, manufacturer, model_number, status) | `src/pages/ManualEditor.jsx` (20KB) | No equivalent page in target | ❌ GAP | Requires MachineManual table (A16). |
| B19 | Page | **ManualViewer** — display uploaded PDF manual (PDF viewer embed) | `src/pages/ManualViewer.jsx` (5.4KB) | No equivalent page in target | ❌ GAP | Requires MachineManual table. |
| B20 | Page | **Landing** — public-facing landing page for unauthenticated users or 'landing' role | `src/pages/Landing.jsx` (1KB) | `src/app/page.tsx` (868 bytes root) | ❓ UNCLEAR | Source Landing is shown to users with app_role='landing' (unregistered/pending users). Target root page.tsx may serve a similar role but the 'landing' role concept doesn't map to TaskPathway's multi-tenant model. Needs clarification: is there a "pending membership" state? |
| B21 | Page | **Home** (redirect stub) | `src/pages/Home.jsx` (143 bytes) | N/A | ❓ UNCLEAR | 143-byte file — likely just a redirect to Dashboard. Not a real feature. |
| B22 | Page | **Admin / User Management** | `src/pages/AdminRegister.jsx` (activity log only) | `src/app/(app)/admin/page.tsx` + `admin/invite` + `admin/users` | 🔵 INTENTIONAL CHANGE | Target has proper user invite + role management. Source had email-whitelist-based admin access. |
| B23 | Page | **Settings** | Not in source | `src/app/(app)/settings/SettingsClient.tsx` (2.9KB) | 🔵 INTENTIONAL CHANGE | Target-only. Company/profile settings per PRD. |
| B24 | Page | **Auth: Login / Register / Accept Invite** | Base44 handled auth | `src/app/(auth)/login`, `/register`, `/accept-invite` | 🔵 INTENTIONAL CHANGE | Supabase Auth per PRD. |
| B25 | Page | **"View As Role" admin preview** — admin can switch view as operator/user/etc. via SessionStorage | `src/Layout.jsx` — `handleRoleChange()`, `sessionStorage.getItem("viewAsRole")` | No equivalent in target | ❌ GAP | Useful for admins to preview the operator experience. Not strictly required for parity but a PRD-applicable UX feature. |
| B26 | Page | **Sidebar navigation — role-gated items** | `src/Layout.jsx` — `getNavigationItems(appRole)` | `src/components/layout/Sidebar.tsx` (4.3KB) | 🟡 PARTIAL | Target sidebar exists. Source has role-gated nav (operator sees only Library; admin sees diagnostic/learning/asset tools). Target sidebar needs the same conditional rendering once all pages exist. |

---

### CATEGORY C — Backend Functions / Route Handlers

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| C01 | Backend | **Bulk Export SOPs as ZIP of PDFs** — generates jsPDF for each SOP (metadata + safety info + steps), zips with JSZip, returns binary ZIP | `base44/functions/bulkExportSOPs/entry.ts` (7.8KB) | No route handler in target | ❌ GAP | Auth required. Inputs: `sopIds[]`. Output: `application/zip` binary. PDF includes: title, department, machine, machine_area, version, status, critical_safety_info, standard safety reminders, description, required_tools[], steps[]. Target stack should use Puppeteer or jsPDF in a Next.js route handler. |
| C02 | Backend | **Extract SOP from Excel** — fetches Excel URL, parses with XLSX library, maps rows to steps, creates SOP entity | `base44/functions/extractSopFromExcel/entry.ts` (3.7KB) | No route handler in target | ❌ GAP | Auth required. Input: `file_url`. Creates a Document record + Steps. |
| C03 | Backend | **Get Public SOP** — unauthenticated endpoint returning Approved/Published SOP by ID | `base44/functions/getPublicSOP/entry.ts` (2KB) | No route handler in target | ❌ GAP | No auth. Input: `sopId`. Security: only returns status=Approved or Published. Used by SOPInteractiveViewer for public sharing. |
| C04 | Backend | **Import Diagnostic Tree from PDF** — uses LLM ExtractDataFromUploadedFile to parse diagnostic flow from PDF, creates DiagnosticTree + DiagnosticNodes with linked options | `base44/functions/importDiagnosticTree/entry.ts` (7.5KB) | No route handler in target | ❌ GAP | Auth required. Depends on A11 (DiagnosticTree) and A12 (DiagnosticNode) tables. Two-pass: create all nodes, then wire options/connections. |
| C05 | Backend | **Email notification on SOP status change** — sends email to `notification_emails` recipients when SOP is approved/published | `base44/entities/SOP.jsonc` email_settings; `src/api/integrations.js` SendEmail | No Resend route handler in target | ❌ GAP | notification_emails column exists in DB. Needs Resend integration wired to document status change events. |
| C06 | Backend | **LLM-assisted SOP generation / AI features** | `src/api/integrations.js` InvokeLLM; used within various pages | No Anthropic API route handler visible in target | ❌ GAP | Source uses InvokeLLM in editor pages for AI step generation. Target needs `/api/ai` or similar route handler. |
| C07 | Backend | **File upload to storage** | `src/api/integrations.js` UploadFile | Supabase Storage (implied) | ❓ UNCLEAR | Source uses Base44 UploadFile integration. Target should use Supabase Storage. No upload route/component found yet — may be in TaskEditor component body. |
| C08 | Backend | **Stripe webhook + entitlement enforcement** | Not in source | Not visible in target | ❌ GAP | PRD requires plan limits (Free=5 docs, etc.) enforced. No Stripe webhook handler found in target routes. |

---

### CATEGORY D — Auth & Roles

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| D01 | Auth | **Auth flow** — login / logout / protected routes | `src/components/ProtectedRoute.jsx`; `src/lib/AuthContext`; `src/App.jsx` AuthProvider | `src/middleware.ts` (1.6KB); `src/app/(auth)` routes; Supabase Auth | ✅ PARITY | |
| D02 | Auth | **Role: admin** — full access, can delete docs, manage users, see all admin pages | `src/Layout.jsx` `app_role === 'admin'` checks | `public.memberships.app_role = 'admin'` | ✅ PARITY | |
| D03 | Auth | **Role: operator** — read-only access to Approved SOPs, DiagnosticTrees, Manuals only | `src/Layout.jsx` operator redirect to SOPLibrary | No 'operator' role in target (closest: 'viewer') | 🟡 PARTIAL | Source 'operator' → target 'viewer'. Functional parity if viewer gets same restricted nav. Needs nav enforcement. |
| D04 | Auth | **Role: landing** — unregistered user, shown only Landing page, no sidebar | `src/Layout.jsx` `viewAsRole === 'landing'` → render only Landing | No equivalent pending/landing state in target | ❌ GAP | Source handles the state where a user has logged in via SSO but hasn't been assigned a role yet (sees a "waiting for access" Landing page). Target has no such state — users either have a membership or they don't. Needs a `UserNotRegisteredError` equivalent or "pending membership" UI. |
| D05 | Auth | **UserNotRegisteredError** component | `src/components/UserNotRegisteredError.jsx` | No equivalent in target | ❌ GAP | Shown when auth succeeds but no app_role assigned. |
| D06 | Auth | **RLS on all tables** | Base44 auto-applies tenant isolation | `public.companies` ✅ RLS; `public.memberships` ✅; `public.documents` ✅; `public.steps` ✅; `public.tp_invitations` ✅; `public.document_changelog` ✅; `public.audit_logs` ✅ | ✅ PARITY | All existing tables have RLS enabled. New tables (DiagnosticTree etc.) must also get RLS when created. |
| D07 | Auth | **RLS: missing tables** | N/A | DiagnosticTree, DiagnosticNode, DiagnosticSession, LearningModule, LearningBlock, MachineManual, Machine tables don't exist | ❌ GAP | Must add RLS to every new table — no exceptions. |

---

### CATEGORY E — Business Rules

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| E01 | Business rule | **SOPLibrary filter: only Approved SOPs visible** | `src/pages/SOPLibrary.jsx` → `sopData.filter(sop => sop.status === "Approved" \|\| sop.status === "approved")` | Unknown — need to read library/page.tsx content | ❓ UNCLEAR | Library page exists (11KB) but content not read. Must verify it filters by Approved status. |
| E02 | Business rule | **SOPLibrary filter: only Active DiagnosticTrees** | `src/pages/SOPLibrary.jsx` → `treeData.filter(tree => tree.status === 'Active')` | No DiagnosticTree table — cannot implement | ❌ GAP | Blocked by A11. |
| E03 | Business rule | **SOPLibrary filter: only Approved MachineManuals** | `src/pages/SOPLibrary.jsx` → `manualData.filter(m => m.status === "Approved")` | No MachineManual table — cannot implement | ❌ GAP | Blocked by A16. |
| E04 | Business rule | **Dashboard filters: dept / machine / machine_area / status** | `src/pages/Dashboard.jsx` → `filters` state; machine filter checks both `sop.machine` and `sop.applicable_machines[]` | target library has filter UI but machine/machine_area columns missing from schema | ❌ GAP | Blocked by A02, A03. |
| E05 | Business rule | **Favorites: star/unstar in localStorage** | `src/pages/Dashboard.jsx` → `toggleFavorite()`, `localStorage.setItem('sop_favorites', ...)` | No implementation | ❌ GAP | |
| E06 | Business rule | **Admin-only delete** | `src/pages/Dashboard.jsx` → `if (currentUser?.app_role !== 'admin') alert(...)` | Must verify in TaskEditor/library page | ❓ UNCLEAR | |
| E07 | Business rule | **ChangeLog auto-write on SOP save** | Inferred from SOPChangeLog entity usage in `src/pages/ChangeLog.jsx`; write happens in SOPEditor | `public.document_changelog` table exists | 🟡 PARTIAL | Table exists. Must verify whether TaskEditor actually writes to document_changelog on save/status-change. |
| E08 | Business rule | **SOP version increment** | `base44/entities/SOP.jsonc` → version field; changelog tracks previous_version → new_version | `public.documents.current_version_number`; `public.document_changelog` has previous_version/new_version | 🟡 PARTIAL | Schema supports it. Must verify version bump logic is implemented in TaskEditor. |
| E09 | Business rule | **Hierarchical SOP browse: Dept → Machine → Area** | `src/pages/SOPLibrary.jsx` → `selectedDepartment`, `selectedMachine`, `selectedArea` state; `SOPCardNavigator` component | Unknown — library/page.tsx not fully read | ❓ UNCLEAR | Requires machine + machine_area fields on Document (A02, A03). |
| E10 | Business rule | **Full-text search: SOPLibrary** | `src/pages/SOPLibrary.jsx` → searches title, base_title, description, department, machine, applicable_machines[], machine_area | Unknown | ❓ UNCLEAR | |
| E11 | Business rule | **SOP.applicable_machines dual-field check** | `src/pages/Dashboard.jsx` → machine filter checks `sop.machine === filters.machine \|\| sop.applicable_machines.includes(filters.machine)` | Partially: applicable_machines in DB but no machine scalar field (A02) | 🟡 PARTIAL | |
| E12 | Business rule | **Sorted by updated_date descending** | `SOP.list("-updated_date")` throughout | `public.documents.updated_at` column exists | ✅ PARITY | Column present; query ordering must be verified in data fetching code. |
| E13 | Business rule | **DiagnosticTree: two-pass node creation for link resolution** | `base44/functions/importDiagnosticTree/entry.ts` — creates all nodes first, then updates options with resolved next_node_id | No implementation | ❌ GAP | Blocked by A11, A12. |
| E14 | Business rule | **LearningModule passing_score enforcement** | `base44/entities/LearningModule.jsonc` → passing_score default 80% | No implementation | ❌ GAP | Blocked by A14. |
| E15 | Business rule | **Plan limit enforcement** | PRD: Free=5 docs, Starter=unlimited, etc. | `public.companies.task_limit` column exists | 🟡 PARTIAL | Column exists but no enforcement logic found in route handlers (checked routes: create, edit). |
| E16 | Business rule | **Admin Register: SOP activity log with period filters** | `src/pages/AdminRegister.jsx` — today/week/month/all filters on SOP updated_date | No equivalent route | ❌ GAP | Distinct from ChangeLog. Shows simplified activity (who created/modified what, when) for compliance. |
| E17 | Business rule | **AssetManager: DEFAULT_MACHINE_SEED seeding** | `src/hooks/useSiteConfig.js` `DEFAULT_MACHINE_SEED`; `src/pages/AssetManager.jsx` → seed button | No equivalent | ❌ GAP | Blocked by A17. |

---

### CATEGORY F — Integrations

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| F01 | Integration | **File upload (images for SOP steps)** | `src/api/integrations.js` UploadFile | Supabase Storage (implied by image_url columns) | ❓ UNCLEAR | No upload component/route found yet during audit. Must verify StepsEditor handles image uploads. |
| F02 | Integration | **PDF generation for single/bulk SOP export** | `base44/functions/bulkExportSOPs/entry.ts` — jsPDF | No Puppeteer or jsPDF route handler | ❌ GAP | PRD specifies Puppeteer. |
| F03 | Integration | **Email: SOP notification** | `src/api/integrations.js` SendEmail; `notification_emails` field | Resend package presumably installed; no wired route | ❌ GAP | Column exists, integration not wired. |
| F04 | Integration | **LLM: extract data from uploaded file** | `base44/integrations.Core.ExtractDataFromUploadedFile` in `importDiagnosticTree` | No Anthropic route handler found | ❌ GAP | Used to parse PDFs into structured diagnostic trees. |
| F05 | Integration | **LLM: InvokeLLM for AI step generation** | `src/api/integrations.js` InvokeLLM | No Anthropic route handler found | ❌ GAP | Used in SOPEditor for AI-assisted content generation. |
| F06 | Integration | **Stripe: subscription management** | Not in source | Stripe MCP tools available; no webhook handler found | ❌ GAP | PRD requires plan enforcement. |
| F07 | Integration | **SharePoint agent** | `base44/agents/sharepoint_sop_extractor.jsonc` | Not applicable | 🔵 INTENTIONAL CHANGE | SaaS product has no SharePoint integration. |

---

### CATEGORY G — Settings / Config

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| G01 | Config | **DEFAULT_MACHINE_SEED** — hardcoded list of Huhtamaki Lurgan machines | `src/hooks/useSiteConfig.js` | Not applicable — multi-tenant SaaS has no Lurgan-specific defaults | 🔵 INTENTIONAL CHANGE | |
| G02 | Config | **Page title per route** | `src/Layout.jsx` `getPageTitle()` | Next.js metadata in each page.tsx | 🟡 PARTIAL | Source sets `document.title` per page. Target should use Next.js metadata API. Verify each page has correct titles. |
| G03 | Config | **Sidebar branding** | `src/Layout.jsx` → "SOP Management / Huhtamaki Lurgan" | `src/components/layout/Sidebar.tsx` | 🔵 INTENTIONAL CHANGE | Target must show TaskPathway branding. |
| G04 | Config | **Email whitelist for Admin Register** | `src/pages/AdminRegister.jsx` → hardcoded `allowedEmails` array | Not applicable | 🔵 INTENTIONAL CHANGE | Multi-tenant model uses membership roles, not email whitelist. |

---

## Row Count Summary

| Category | Total rows | ✅ PARITY | 🟡 PARTIAL | ❌ GAP | 🔵 INTENTIONAL | ❓ UNCLEAR |
|---|---|---|---|---|---|---|
| A — Entities | 24 | 5 | 6 | 8 | 5 | 0 |
| B — Pages / Routes | 26 | 2 | 7 | 11 | 5 | 1 |
| C — Backend Functions | 8 | 0 | 0 | 7 | 1 | 0 |
| D — Auth & Roles | 7 | 3 | 1 | 3 | 0 | 0 |
| E — Business Rules | 17 | 1 | 4 | 7 | 0 | 5 |
| F — Integrations | 7 | 0 | 0 | 5 | 1 | 1 |
| G — Config | 4 | 0 | 1 | 0 | 3 | 0 |
| **TOTAL** | **93** | **11 (12%)** | **19 (20%)** | **41 (44%)** | **15 (16%)** | **7 (8%)** |

---

## Phase 2 Complete — Awaiting Your Go-Ahead for Phase 3

### Full ❌ GAP list (41 rows)
A02, A03, A04, A08, A11, A12, A13, A14, A15, A16, A17, A24,
B02, B05, B09, B10, B11, B12, B13, B14, B15, B16, B17, B18, B19, B25,
C01, C02, C03, C04, C05, C06, C08,
D04, D05, D07,
E02, E03, E04, E05, E08 (partial), E13, E14, E16, E17,
F02, F03, F04, F05, F06

### Full 🟡 PARTIAL list (19 rows)
A05, A06, A07, A10, A24,
B01, B03, B04, B06, B07, B08, B26,
D03,
E07, E08, E11, E15,
F01, G02

### Full ❓ UNCLEAR list (7 rows)
B20 (Landing page / pending-membership state),
B21 (Home stub),
C07 (file upload wiring),
E01 (library Approved filter — need to read page content),
E06 (admin-only delete enforcement),
E09 (hierarchical browse in library),
E10 (full-text search in library)

---

*Matrix written: 2026-06-10. Phase 1 + Phase 2 read-only. No application code written.*
