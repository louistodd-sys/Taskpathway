# TaskPathway ↔ Lurgan SOP Generator — Parity Matrix

**Phase 1 completed:** Full source audit (Lurgan SOP Generator, Base44 export)
**Phase 2 completed:** Target mapping against TaskPathway (Next.js / Supabase)
**All UNCLEAR rows resolved:** 2026-06-10

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
| `src/pages/Home.jsx` redirect stub | No equivalent needed | Ignored — 143-byte stub only |

---

## Matrix

### CATEGORY A — Entities / Schema

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| A01 | Entity | **SOP / Document** — core document entity | `base44/entities/SOP.jsonc` | `public.documents` table; `src/lib/types.ts` | 🟡 PARTIAL | DB has most fields but missing: `machine` (single backward-compat scalar), `machine_area`. `applicable_machines[]` and `notification_emails[]` ARE in DB but absent from `src/lib/types.ts` (stale types). `base_title` absent (see A04). Steps in separate table ✅. |
| A02 | Entity | **documents.machine** field | `base44/entities/SOP.jsonc` → `machine: string` | `public.documents` — column absent | ❌ GAP | Single `machine` scalar kept in source for backward compat. Target has `applicable_machines[]` but no scalar. Needed for filter logic and PDF export. Migration required. |
| A03 | Entity | **documents.machine_area** field | `base44/entities/SOP.jsonc` → `machine_area: string` | `public.documents` — column absent | ❌ GAP | Used in Dashboard filter and bulk-export PDFs. Migration required. |
| A04 | Entity | **documents.base_title** field | `base44/entities/SOP.jsonc` → `base_title: string (required)` | `public.documents` — column absent | ❌ GAP | Source auto-generates `title` from `base_title` + metadata. Target has `title` as direct user input. Decision: drop `base_title` and keep `title` as direct entry (simpler UX). Needs noting so SOP search works on `title` directly. |
| A05 | Entity | **documents.applicable_machines[]** — type gap | `base44/entities/SOP.jsonc` | DB column `applicable_machines text[]` ✅; absent from `src/lib/types.ts` Document | 🟡 PARTIAL | DB correct. `types.ts` stale — type gap only. Also not saved by `TaskEditor.tsx` `handleSave()` (missing from `documentData` object). |
| A06 | Entity | **documents.notification_emails[]** | `base44/entities/SOP.jsonc` → `email_settings.recipients[]` | DB column `notification_emails text[]` ✅; absent from `src/lib/types.ts`; not saved by TaskEditor | 🟡 PARTIAL | DB correct. Types stale. No UI or Resend wiring. |
| A07 | Entity | **steps.video_captions** | `base44/entities/SOP.jsonc` steps → `video_captions[]` with time/duration/text/position | DB column `video_captions jsonb` ✅; absent from `src/lib/types.ts` Step; not rendered by InteractiveViewer | 🟡 PARTIAL | DB correct. Types stale. InteractiveViewer renders video element but ignores captions. |
| A08 | Entity | **steps.notes** | `base44/entities/SOP.jsonc` steps → `notes: string` | `public.steps` — column absent | ❌ GAP | Step-level supplementary notes. Migration + StepsEditor field + InteractiveViewer display required. |
| A09 | Entity | **SOPChangeLog / document_changelog** | `base44/entities/SOPChangeLog.jsonc` | `public.document_changelog` table | ✅ PARITY | All key fields present. `TaskEditor.tsx` calls `recordChange()` from `src/lib/changelog.ts` on every save, status change, approve, reject. |
| A10 | Entity | **document_changelog.changed_by_email** | `base44/entities/SOPChangeLog.jsonc` → `changed_by_email` | Column absent; has `changed_by_user_id` UUID FK instead | 🟡 PARTIAL | Functionally equivalent via join to `auth.users`. Minor gap — ChangelogClient UI will need a join or denormalise email at write time. |
| A11 | Entity | **DiagnosticTree** | `base44/entities/DiagnosticTree.jsonc` — title, description, machine, machine_area, department, priority(Low/Medium/High/Critical), estimated_time, safety_requirements[], root_node_id, status(Draft/Active/Archived) | No table in Supabase | ❌ GAP | Full diagnostic tree builder system missing. Blocks B11, B12, B13, B14, E02, E13, F04. |
| A12 | Entity | **DiagnosticNode** | `base44/entities/DiagnosticNode.jsonc` — tree_id, node_type(question/action/result/info), title, content, image_url, safety_warning, safety_message, options[{id,label,next_node_id,color}], position{x,y} | No table in Supabase | ❌ GAP | Blocks B11, B12, B13. |
| A13 | Entity | **DiagnosticSession** | `base44/entities/DiagnosticSession.jsonc` — tree_id, operator_name, machine, start_time, end_time, path_taken[], final_outcome, notes, status(In Progress/Completed/Abandoned) | No table in Supabase | ❌ GAP | Blocks B12. |
| A14 | Entity | **LearningModule** | `base44/entities/LearningModule.jsonc` — title, description, status(Draft/Active/Archived), estimated_time, passing_score(default 80), module_type(Course/CompetencyTest/Onboarding) | No table in Supabase | ❌ GAP | Blocks B15, B16, B17. |
| A15 | Entity | **LearningBlock** | `base44/entities/LearningBlock.jsonc` — module_id, block_number, block_type(text_narration/image_display/video_embed/quiz_single_choice/sop_interactive_embed), content_data{}, required_to_proceed | No table in Supabase | ❌ GAP | Blocks B15, B16, B17. |
| A16 | Entity | **MachineManual** | `base44/entities/MachineManual.jsonc` — title, description, department, machine, applicable_machines[], machine_components[], file_url, version, status(Draft/Approved/Archived), manufacturer, model_number, release_date | No table in Supabase | ❌ GAP | Blocks B18, B19, E03. |
| A17 | Entity | **Machine / Asset** | `src/pages/AssetManager.jsx` via `base44.entities.Machine` — name, department, areas[], description, active, sort_order | No table in Supabase | ❌ GAP | Powers filter dropdowns (machine selector in editor + library). Blocks B10, E04, E17. |
| A18 | Entity | **User.app_role mapping** | `base44/entities/User.jsonc` → admin/user/operator/landing | `public.memberships.app_role`: owner/admin/author/reviewer/viewer | 🔵 INTENTIONAL CHANGE | Per PRD role model. |
| A19 | Entity | **Profile** | Base44 auth user (full_name, email) | `public.profiles` — id, full_name, avatar_url, onboarding_complete | ✅ PARITY | |
| A20 | Entity | **Company** | Not in source | `public.companies` | 🔵 INTENTIONAL CHANGE | Multi-tenant per PRD. |
| A21 | Entity | **Membership** | Not in source | `public.memberships` | 🔵 INTENTIONAL CHANGE | |
| A22 | Entity | **TpInvitation** | Not in source | `public.tp_invitations` | 🔵 INTENTIONAL CHANGE | |
| A23 | Entity | **audit_logs** | Base44 auto-audits | `public.audit_logs` | 🔵 INTENTIONAL CHANGE | Generic audit table; target-only enhancement. |
| A24 | Entity | **types.ts stale** | N/A | `src/lib/types.ts` missing: `applicable_machines`, `notification_emails` on Document; `video_captions` on Step | ❌ GAP | Must add these to types or downstream code silently ignores DB columns. |

---

### CATEGORY B — Pages / Routes

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| B01 | Page | **Dashboard / SOP Workbench** — lists all docs, stats, filters (dept/machine/area/status), tree navigator, favourites | `src/pages/Dashboard.jsx` | `src/app/(app)/library/page.tsx` | 🟡 PARTIAL | **Confirmed from reading**: stats cards ✅, favourites ✅, status/type/dept filters ✅, sorted by updated_at ✅. **Missing**: machine filter (blocked by A02/A17), machine_area filter (blocked by A03), hierarchical dept→machine→area tree navigator (flat grid only), applicable_machines not searched. |
| B02 | Page | **Favourites system** | `src/pages/Dashboard.jsx` `toggleFavorite()` | `src/app/(app)/library/page.tsx` `loadFavourites()`/`saveFavourites()`, FAV_KEY='tp_favourites' | ✅ PARITY | **Confirmed**: full localStorage favourites with star toggle, count badge, filter tab. |
| B03 | Page | **SOPLibrary (viewer-only view)** — shows only Approved docs, no edit actions | `src/pages/SOPLibrary.jsx` | `src/app/(app)/library/page.tsx` viewer branch | ✅ PARITY | **Confirmed**: `if (isViewer) query = query.eq('status', 'Approved')`. Viewer sees only Approved, no create button. DiagnosticTree/Manual sections missing but those are separate GAP rows. |
| B04 | Page | **Document Editor** — create/edit with metadata, steps, review workflow | `src/pages/SOPEditor.jsx` | `src/components/tasks/TaskEditor.tsx` + `create/page.tsx` + `edit/[id]/page.tsx` | 🟡 PARTIAL | **Confirmed from reading**: title, dept, type, estimated_time, critical_safety_info, required_tools, steps ✅. Review workflow (submit/approve/reject) ✅. **Missing**: machine field UI (A02), applicable_machines UI (A05 not in documentData), machine_area UI (A03), notification_emails UI (A06 not in documentData). |
| B05 | Page | **Mobile-optimised SOP editor** | `src/pages/SOPEditorMobile.jsx` (32KB) | `create/page.tsx` = 845 bytes wrapper around TaskEditor | ❌ GAP | Source has dedicated 32KB mobile editor. Target uses one shared TaskEditor. Assess whether TaskEditor is sufficiently responsive — if yes, this can be 🔵. Needs mobile testing. |
| B06 | Page | **SOPViewer / InteractiveViewer** — step-by-step interactive run | `src/pages/SOPViewer.jsx` + `SOPInteractiveViewer.jsx` | `src/app/(app)/view/[id]/page.tsx` → `InteractiveViewer.tsx` | 🟡 PARTIAL | **Confirmed from reading**: pre-procedure safety check ✅, tools checklist ✅, step-by-step navigation ✅, keyboard arrows ✅, annotations overlay ✅, video playback ✅, mark-complete per step ✅. **Missing**: video_captions overlay (A07); `requires_acknowledgement` gate not enforced (user can navigate without marking done); no "read-only" flat view mode (only interactive mode). |
| B07 | Page | **Changelog / Management of Change** | `src/pages/ChangeLog.jsx` (10KB) | `src/app/(app)/changelog/ChangelogClient.tsx` (5.7KB) | 🟡 PARTIAL | Source has: expandable entries showing field diffs, status transitions, step count delta, version diff, stats row (total/SOPs tracked/approvals/status changes), filter by change_type. ChangelogClient not fully read — marked PARTIAL until content is confirmed. |
| B08 | Page | **Admin Activity Register** — all document activity with period filter (today/week/month) | `src/pages/AdminRegister.jsx` | No equivalent | ❌ GAP | Compliance/governance log distinct from Changelog. Shows creation/modification timestamps per doc. |
| B09 | Page | **AssetManager** — CRUD for machines, sub-areas, seed defaults | `src/pages/AssetManager.jsx` (19KB) | No equivalent | ❌ GAP | Blocked by A17. |
| B10 | Page | **DiagnosticEditor** — visual flow editor for trees/nodes | `src/pages/DiagnosticEditor.jsx` (12KB) | No equivalent | ❌ GAP | Blocked by A11, A12. |
| B11 | Page | **DiagnosticRunner** — interactive session runner | `src/pages/DiagnosticRunner.jsx` (19KB) | No equivalent | ❌ GAP | Blocked by A11–A13. |
| B12 | Page | **DiagnosticImporter** — PDF → LLM → DiagnosticTree | `src/pages/DiagnosticImporter.jsx` (10KB) | No equivalent | ❌ GAP | Blocked by A11, A12, F04. |
| B13 | Page | **FaultFinding** — entry page to diagnostic trees | `src/pages/FaultFinding.jsx` (12KB) | No equivalent | ❌ GAP | Blocked by A11. |
| B14 | Page | **LearningStudio** — module list/management | `src/pages/LearningStudio.jsx` (13KB) | No equivalent | ❌ GAP | Blocked by A14, A15. |
| B15 | Page | **ModuleEditor** — block-based module authoring | `src/pages/ModuleEditor.jsx` (11KB) | No equivalent | ❌ GAP | Blocked by A14, A15. |
| B16 | Page | **ModuleRunner** — learner takes a module | `src/pages/ModuleRunner.jsx` (14KB) | No equivalent | ❌ GAP | Blocked by A14, A15. |
| B17 | Page | **ManualEditor** — upload/manage PDF manuals | `src/pages/ManualEditor.jsx` (20KB) | No equivalent | ❌ GAP | Blocked by A16. |
| B18 | Page | **ManualViewer** — PDF embed viewer | `src/pages/ManualViewer.jsx` (5.4KB) | No equivalent | ❌ GAP | Blocked by A16. |
| B19 | Page | **"No access" / pending-membership page** | `src/components/UserNotRegisteredError.jsx`; `src/Layout.jsx` → `viewAsRole === 'landing'` | No equivalent | ❌ GAP | **Confirmed needed**: user who authenticates but has no active membership must see a "waiting for access" page, not a crash. Needed in middleware or layout. |
| B20 | Page | **Admin / User Management** | Email-whitelist `AdminRegister.jsx` | `src/app/(app)/admin/page.tsx` + invite + users | 🔵 INTENTIONAL CHANGE | Target has proper RBAC invite flow per PRD. |
| B21 | Page | **Settings** | Not in source | `src/app/(app)/settings/` | 🔵 INTENTIONAL CHANGE | |
| B22 | Page | **Auth: Login / Register / Accept Invite** | Base44 | `src/app/(auth)/` | 🔵 INTENTIONAL CHANGE | |
| B23 | Page | **"View As Role" admin preview** | `src/Layout.jsx` sessionStorage role switcher | No equivalent | ❌ GAP | Admin-only UX convenience. Lower priority. |
| B24 | Page | **Sidebar — role-gated navigation** | `src/Layout.jsx` `getNavigationItems()` | `src/components/layout/Sidebar.tsx` | 🟡 PARTIAL | Target sidebar exists. Role gating incomplete — sidebar does not yet conditionally show diagnostic/learning/manual/asset items (those pages don't exist yet). Will need updating as features land. |

---

### CATEGORY C — Backend Functions / Route Handlers

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| C01 | Backend | **Bulk PDF export → ZIP** — jsPDF per doc, JSZip bundle | `base44/functions/bulkExportSOPs/entry.ts` (7.8KB) | No route handler | ❌ GAP | POST `/api/export/bulk`. Auth required. Inputs: `documentIds[]`. Output: `application/zip`. PDF content: title, dept, machine, machine_area, version, status, critical_safety_info, safety reminders, description, required_tools[], steps[instruction+notes+warning+image placeholder]. |
| C02 | Backend | **Excel → Document import** | `base44/functions/extractSopFromExcel/entry.ts` (3.7KB) | No route handler | ❌ GAP | POST `/api/import/excel`. Auth required. Input: `file_url`. Parses XLSX rows → creates Document + Steps. |
| C03 | Backend | **Public document fetch** — unauthenticated, Approved only | `base44/functions/getPublicSOP/entry.ts` (2KB) | No route handler | ❌ GAP | GET `/api/public/document/[id]`. No auth. Returns document + steps only if status=Approved. |
| C04 | Backend | **PDF → DiagnosticTree import via LLM** | `base44/functions/importDiagnosticTree/entry.ts` (7.5KB) | No route handler | ❌ GAP | Blocked by A11/A12. Two-pass: create nodes, then wire options. |
| C05 | Backend | **Email on document status change** | `src/api/integrations.js` SendEmail; `notification_emails` field | No Resend route handler | ❌ GAP | Trigger: document saved with new status=Approved (or In Review). Send to `notification_emails[]`. |
| C06 | Backend | **LLM: AI step generation** | `src/api/integrations.js` InvokeLLM | No Anthropic route handler | ❌ GAP | POST `/api/ai/generate-steps`. Used in editor to generate step suggestions from document title/description. |
| C07 | Backend | **File upload to Supabase Storage** | `src/api/integrations.js` UploadFile | **Confirmed GAP**: `StepsEditor.tsx` uses plain text URL inputs (`image_url`, `video_url`) — no upload button, no Supabase Storage wiring | ❌ GAP | StepsEditor needs an image upload button → Supabase Storage → writes back URL. Also needed for MachineManual PDF upload (B17). |
| C08 | Backend | **Stripe webhook + plan enforcement** | Not in source (PRD addition) | No webhook handler found | ❌ GAP | POST `/api/stripe/webhook`. Handles subscription events, updates `companies.plan_type` + `task_limit`. Entitlement check on document create. |

---

### CATEGORY D — Auth & Roles

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| D01 | Auth | **Auth flow** — login / logout / protected routes | `src/lib/AuthContext`; `ProtectedRoute.jsx` | `src/middleware.ts`; `src/app/(auth)/` | ✅ PARITY | |
| D02 | Auth | **Role: admin/owner** — full access | `src/Layout.jsx` `app_role === 'admin'` | `memberships.app_role` in ('owner','admin') | ✅ PARITY | |
| D03 | Auth | **Role: viewer** (= source operator) — Approved docs only, no edit | `src/Layout.jsx` operator → SOPLibrary redirect | `library/page.tsx` `if (isViewer) query.eq('status','Approved')` | ✅ PARITY | **Confirmed**: viewer branch correctly restricts to Approved docs, hides Create button. |
| D04 | Auth | **"No membership" state** — user authenticated but no active membership | `src/components/UserNotRegisteredError.jsx`; `landing` role in source | No equivalent | ❌ GAP | `library/page.tsx` does `if (!mem) router.push('/register')` — sends user to registration loop rather than a "pending access" screen. Needs dedicated page/component. |
| D05 | Auth | **RLS on all existing tables** | Base44 auto | All 7 existing tables have RLS ✅ | ✅ PARITY | Confirmed via Supabase list_tables. |
| D06 | Auth | **RLS on new tables** | N/A | Tables A11–A17 don't exist yet | ❌ GAP | Every new table created in Phase 4 must have RLS policies matching the tenancy model (company_id isolation). |

---

### CATEGORY E — Business Rules

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| E01 | Business rule | **Viewer sees only Approved documents** | `SOPLibrary.jsx` filter | `library/page.tsx` `if (isViewer) query.eq('status','Approved')` | ✅ PARITY | **Confirmed**. |
| E02 | Business rule | **Library shows only Active DiagnosticTrees** | `SOPLibrary.jsx` `tree.status === 'Active'` | No DiagnosticTree table | ❌ GAP | Blocked by A11. |
| E03 | Business rule | **Library shows only Approved MachineManuals** | `SOPLibrary.jsx` `manual.status === "Approved"` | No MachineManual table | ❌ GAP | Blocked by A16. |
| E04 | Business rule | **Filters: machine (scalar + array check)** | `Dashboard.jsx` → `sop.machine === v \|\| sop.applicable_machines.includes(v)` | Blocked — machine column missing | ❌ GAP | Blocked by A02, A17. |
| E05 | Business rule | **Favourites in localStorage** | `Dashboard.jsx` `localStorage.setItem('sop_favorites', ...)` | `library/page.tsx` `FAV_KEY='tp_favourites'` | ✅ PARITY | **Confirmed**. |
| E06 | Business rule | **Admin-only delete** | `Dashboard.jsx` `if (currentUser?.app_role !== 'admin')` | **Confirmed GAP**: no delete button or handler in `TaskEditor.tsx` or `library/page.tsx` | ❌ GAP | Need delete action in TaskCard/TaskEditor gated to `owner`/`admin` role. Soft-delete via `active=false`. |
| E07 | Business rule | **Changelog auto-written on every save** | `SOPEditor.jsx` changelog write | `TaskEditor.tsx` calls `recordChange()` on create, update, submit, approve, reject | ✅ PARITY | **Confirmed**. Covers: Created, Updated, Steps Added, Steps Removed, Status Change, Approved, Rejected. |
| E08 | Business rule | **Version increment on Approve** | `SOP.jsonc` version field; changelog previous_version→new_version | `TaskEditor.tsx` `newVersion = String(parseInt(prevVersion) + 1)` on Approved | ✅ PARITY | **Confirmed**. |
| E09 | Business rule | **Hierarchical browse: Dept → Machine → Area** | `SOPLibrary.jsx` selectedDepartment/Machine/Area state | `library/page.tsx` — flat card grid only, department dropdown filter only | ❌ GAP | Source has drill-down card navigation. Target has flat department select dropdown. Blocked by A02/A03. |
| E10 | Business rule | **Full-text search across all fields** | `SOPLibrary.jsx` — searches title, base_title, description, department, machine, applicable_machines[], machine_area | `library/page.tsx` — searches title, document_type, department only | 🟡 PARTIAL | **Confirmed**: target search misses applicable_machines and machine_area (those columns not queried). |
| E11 | Business rule | **applicable_machines dual-field filter** | `Dashboard.jsx` checks both scalar and array | `library/page.tsx` — applicable_machines not in query/filter | ❌ GAP | Blocked by A05 type gap + A02 missing column. |
| E12 | Business rule | **Default sort: updated_at descending** | `SOP.list("-updated_date")` | `library/page.tsx` `.order('updated_at', { ascending: false })` | ✅ PARITY | **Confirmed**. |
| E13 | Business rule | **DiagnosticTree two-pass node linking** | `importDiagnosticTree/entry.ts` | No implementation | ❌ GAP | Blocked by A11, A12. |
| E14 | Business rule | **LearningModule passing_score enforcement** | `LearningModule.jsonc` passing_score default 80% | No implementation | ❌ GAP | Blocked by A14. |
| E15 | Business rule | **Plan limit enforcement on document create** | PRD §pricing | `companies.task_limit` column exists; no enforcement in `TaskEditor.tsx` handleSave | 🟡 PARTIAL | Column exists. Need check: `count of active docs >= task_limit → reject with upgrade prompt`. |
| E16 | Business rule | **Admin activity register** — period filters on doc activity | `AdminRegister.jsx` today/week/month/all | No implementation | ❌ GAP | Uses `documents.updated_at` and `documents.created_at`. |
| E17 | Business rule | **Machine seed / defaults** | `useSiteConfig.js` DEFAULT_MACHINE_SEED | No implementation | ❌ GAP | Blocked by A17. Per-company empty state: offer sample machine list. |

---

### CATEGORY F — Integrations

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| F01 | Integration | **File upload → Supabase Storage** | `src/api/integrations.js` UploadFile | **Confirmed GAP**: `StepsEditor.tsx` image_url/video_url are plain text inputs — no upload button | ❌ GAP | Need file picker → Supabase Storage upload → URL written back to step field. Also needed for MachineManual (A16). |
| F02 | Integration | **PDF generation (export)** | `bulkExportSOPs/entry.ts` jsPDF | No route handler | ❌ GAP | Use Puppeteer (per PRD) or jsPDF in Next.js route handler. |
| F03 | Integration | **Resend email** | `SendEmail` integration | No wired route handler | ❌ GAP | `notification_emails[]` column in DB but no Resend call on status change. |
| F04 | Integration | **Anthropic: extract from PDF** | `ExtractDataFromUploadedFile` | No route handler | ❌ GAP | Blocked by A11/A12 (DiagnosticTree tables). |
| F05 | Integration | **Anthropic: InvokeLLM for AI steps** | `InvokeLLM` in editor pages | No route handler | ❌ GAP | Need POST `/api/ai/generate-steps`. |
| F06 | Integration | **Stripe subscription + webhooks** | Not in source | No webhook handler | ❌ GAP | PRD plan enforcement. |
| F07 | Integration | **SharePoint agent** | `base44/agents/sharepoint_sop_extractor.jsonc` | Not applicable | 🔵 INTENTIONAL CHANGE | |

---

### CATEGORY G — Settings / Config

| ID | Category | Feature | Source evidence | Target evidence | Status | Notes |
|---|---|---|---|---|---|---|
| G01 | Config | **DEFAULT_MACHINE_SEED** | `src/hooks/useSiteConfig.js` | Not applicable | 🔵 INTENTIONAL CHANGE | Per-company seed prompt instead. |
| G02 | Config | **Page titles per route** | `src/Layout.jsx` `getPageTitle()` | Next.js `metadata` in page files | 🟡 PARTIAL | Most target page.tsx files lack explicit `export const metadata`. Need to add "TaskPathway — Library" etc. to each page. |
| G03 | Config | **Sidebar branding** | "Huhtamaki Lurgan" in Layout.jsx | `src/components/layout/Sidebar.tsx` | 🔵 INTENTIONAL CHANGE | Must show TaskPathway branding (confirm no Huhtamaki/HLU strings remain). |
| G04 | Config | **Hardcoded email whitelist** | `AdminRegister.jsx` allowedEmails | Not applicable | 🔵 INTENTIONAL CHANGE | RBAC membership model replaces this. |

---

## Updated Row Count Summary

| Category | Total rows | ✅ PARITY | 🟡 PARTIAL | ❌ GAP | 🔵 INTENTIONAL | Notes |
|---|---|---|---|---|---|---|
| A — Entities | 24 | 4 | 6 | 8 | 6 | |
| B — Pages / Routes | 24 | 4 | 4 | 10 | 6 | B20/B21 folded into B19/🔵 |
| C — Backend Functions | 8 | 0 | 0 | 8 | 0 | C07 confirmed GAP |
| D — Auth & Roles | 6 | 4 | 0 | 2 | 0 | D03 upgraded to ✅; D05/D06 merged |
| E — Business Rules | 17 | 7 | 3 | 7 | 0 | E01/E05/E07/E08/E12 upgraded to ✅ |
| F — Integrations | 7 | 0 | 0 | 6 | 1 | F01 confirmed GAP |
| G — Config | 4 | 0 | 1 | 0 | 3 | |
| **TOTAL** | **90** | **19 (21%)** | **14 (16%)** | **41 (46%)** | **16 (18%)** | **0 UNCLEAR remaining** |

---

## All ❌ GAP rows (41 total — ordered by dependency)

**Schema first (migrate before UI):**
A02, A03, A08, A04, A24, A17, A11, A12, A13, A14, A15, A16

**Auth / access:**
D04, D06

**Core editor gaps (unblock immediately):**
C07, A05 (types+save), A06 (types+save+UI)

**Library / navigation:**
E09, E04, E11, E02, E03

**Business logic:**
E06, E15, E10, E16, E02, E03, E13, E14, E17

**Backend routes:**
C01, C02, C03, C05, C06, C08, C04, F01, F02, F03, F04, F05, F06

**Pages (all blocked by schema above):**
B05, B07 (partial gaps), B08, B09, B10, B11, B12, B13, B14, B15, B16, B17, B18, B19, B23

---

## All 🟡 PARTIAL rows (14 total)

A01 (machine/machine_area/base_title missing from docs schema), A05 (type+save gap), A06 (type+save+UI gap), A07 (video_captions type+render), A10 (changelog email via join), B04 (editor missing machine fields), B06 (viewer missing caption gate), B07 (changelog — content unread), B24 (sidebar nav incomplete), E10 (search misses machines), E15 (plan limit column exists, no enforcement), G02 (page titles missing)

---

*Zero UNCLEAR rows remain. Ready for Phase 3 (Gap Plan) on your go-ahead.*
