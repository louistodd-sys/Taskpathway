# TaskPathway — Gap Plan (Phase 3)

Generated from PARITY_MATRIX.md after Phase 2 audit.  
Addresses all 41 ❌ GAP rows and 14 🟡 PARTIAL rows in dependency order.  
**No implementation begins until user approves this plan.**

---

## Dependency layers

```
Layer 0 — Schema migrations (must land first; everything else depends on correct columns)
Layer 1 — TypeScript types sync (types.ts must reflect actual DB schema)
Layer 2 — Auth / RLS (new tables need row-level security before any UI touches them)
Layer 3 — Storage & file upload (prerequisite for StepsEditor upload and PDF export)
Layer 4 — Backend route handlers (API routes that UI and integrations call)
Layer 5 — Core editor fixes (TaskEditor + StepsEditor correctness gaps)
Layer 6 — Library / navigation fixes (search, filters, hierarchical browse)
Layer 7 — Business-logic gates (plan limits, delete soft-gate, acknowledgement hard-gate)
Layer 8 — New full pages (Diagnostic, Learning, Manual, AssetManager, etc.)
Layer 9 — Admin utilities (activity register, View-As-Role)
Layer 10 — Final sweep (re-read every cited file, confirm all statuses)
```

---

## Layer 0 — Schema migrations

### GAP-A02 · documents.machine column
- **Source evidence:** SOP entity has `machine` field (base44/entities/SOP.jsonc).
- **Target state:** Column absent from documents table (confirmed via Supabase list_tables).
- **Migration:**
  ```sql
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS machine TEXT;
  ```
- **Verification:** `SELECT column_name FROM information_schema.columns WHERE table_name='documents' AND column_name='machine';` returns a row.

### GAP-A03 · documents.machine_area column
- **Source evidence:** SOP entity has `machine_area` field.
- **Migration:**
  ```sql
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS machine_area TEXT;
  ```
- **Verification:** Same pattern as A02.

### GAP-A05 · documents.applicable_machines column
- **Source evidence:** SOP entity has `applicable_machines[]` (array of machine names).
- **Migration:**
  ```sql
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS applicable_machines TEXT[] DEFAULT '{}';
  ```
- **Verification:** Column visible in list_tables output.

### GAP-A06 · documents.notification_emails column
- **Source evidence:** SOP entity has `email_settings.recipients[]`; maps to flat array in target.
- **Migration:**
  ```sql
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS notification_emails TEXT[] DEFAULT '{}';
  ```

### GAP-A08 · steps.notes column
- **Source evidence:** SOP step has `notes` field (base44/entities/SOP.jsonc).
- **Target state:** steps table has no `notes` column.
- **Migration:**
  ```sql
  ALTER TABLE steps ADD COLUMN IF NOT EXISTS notes TEXT;
  ```

### GAP-A17 · machines table
- **Source evidence:** AssetManager.jsx uses `base44.entities.Machine` with fields: name, department, areas[], description, active, sort_order.
- **Migration:**
  ```sql
  CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department TEXT,
    areas TEXT[] DEFAULT '{}',
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### GAP-A11 · diagnostic_trees table
- **Source evidence:** DiagnosticTree.jsonc — title, description, machine, machine_area, department, priority, estimated_time, safety_requirements[], root_node_id, status.
- **Migration:**
  ```sql
  CREATE TABLE IF NOT EXISTS diagnostic_trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    machine TEXT,
    machine_area TEXT,
    department TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Critical')),
    estimated_time INT,
    safety_requirements TEXT[] DEFAULT '{}',
    root_node_id UUID,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Active','Archived')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### GAP-A12 · diagnostic_nodes table
- **Source evidence:** DiagnosticNode.jsonc — tree_id, node_type, title, content, image_url, safety_warning, safety_message, options (jsonb), position (jsonb).
- **Migration:**
  ```sql
  CREATE TABLE IF NOT EXISTS diagnostic_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tree_id UUID NOT NULL REFERENCES diagnostic_trees(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL CHECK (node_type IN ('question','action','result','info')),
    title TEXT,
    content TEXT,
    image_url TEXT,
    safety_warning BOOLEAN DEFAULT FALSE,
    safety_message TEXT,
    options JSONB DEFAULT '[]',
    position JSONB DEFAULT '{"x":0,"y":0}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### GAP-A13 · diagnostic_sessions table
- **Source evidence:** DiagnosticSession.jsonc — tree_id, operator_name, machine, start_time, end_time, path_taken[], final_outcome, notes, status.
- **Migration:**
  ```sql
  CREATE TABLE IF NOT EXISTS diagnostic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tree_id UUID NOT NULL REFERENCES diagnostic_trees(id) ON DELETE CASCADE,
    operator_name TEXT,
    machine TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    path_taken JSONB DEFAULT '[]',
    final_outcome TEXT,
    notes TEXT,
    status TEXT DEFAULT 'In Progress' CHECK (status IN ('In Progress','Completed','Abandoned')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### GAP-A14 · learning_modules table
- **Source evidence:** LearningModule.jsonc — title, description, status, estimated_time, passing_score (default 80), module_type.
- **Migration:**
  ```sql
  CREATE TABLE IF NOT EXISTS learning_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Active','Archived')),
    estimated_time INT,
    passing_score INT DEFAULT 80,
    module_type TEXT DEFAULT 'Course' CHECK (module_type IN ('Course','CompetencyTest','Onboarding')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### GAP-A15 · learning_blocks table
- **Source evidence:** LearningBlock.jsonc — module_id, block_number, block_type, content_data (jsonb), required_to_proceed.
- **Migration:**
  ```sql
  CREATE TABLE IF NOT EXISTS learning_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    block_number INT NOT NULL,
    block_type TEXT NOT NULL CHECK (block_type IN ('text_narration','image_display','video_embed','quiz_single_choice','sop_interactive_embed')),
    content_data JSONB DEFAULT '{}',
    required_to_proceed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### GAP-A16 · machine_manuals table
- **Source evidence:** MachineManual.jsonc — title, description, department, machine, applicable_machines[], machine_components[], file_url, version, status, manufacturer, model_number, release_date.
- **Migration:**
  ```sql
  CREATE TABLE IF NOT EXISTS machine_manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT,
    machine TEXT,
    applicable_machines TEXT[] DEFAULT '{}',
    machine_components TEXT[] DEFAULT '{}',
    file_url TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Approved','Archived')),
    manufacturer TEXT,
    model_number TEXT,
    release_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### PARTIAL-A04 · base_title decision
- **Source evidence:** SOP entity has `base_title` as the required field; `title` is derived/display. Target has only `title`.
- **Decision:** Add `base_title TEXT` to documents table. TaskEditor saves `base_title` = entered title on create; on update keeps original `base_title` while updating `title`. This matches source semantics.
- **Migration:**
  ```sql
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS base_title TEXT;
  UPDATE documents SET base_title = title WHERE base_title IS NULL;
  ```

---

## Layer 1 — TypeScript types sync

### GAP-A24 · src/lib/types.ts out of sync with DB
- **Target file:** `src/lib/types.ts`
- **Changes:**
  1. Add to `Document` interface: `machine?: string`, `machine_area?: string`, `applicable_machines?: string[]`, `notification_emails?: string[]`, `base_title?: string`.
  2. Add to `Step` interface: `notes?: string`, `video_captions?: VideoCaption[]`.
  3. Add new interfaces: `VideoCaption { id: string; time: number; duration: number; text: string; position: { x: number; y: number } }`, `Machine`, `DiagnosticTree`, `DiagnosticNode`, `DiagnosticSession`, `LearningModule`, `LearningBlock`, `MachineManual`.
- **Verification:** `npx tsc --noEmit` passes.

---

## Layer 2 — Auth / RLS

### GAP-D04 · Pending-membership state
- **Source evidence:** Source app handles `user_not_registered` error and redirects to Landing. TaskPathway needs a route for users who have a valid auth session but no accepted membership in any company.
- **Target files to create/modify:**
  - Create `src/app/(auth)/pending-membership/page.tsx` — static page explaining the user has no active workspace, with a "Request access" CTA or link to create a company.
  - Modify `src/middleware.ts` — after auth check, if no membership row exists for the user, redirect to `/pending-membership` instead of `/login`.
- **Verification:** Create a Supabase auth user with no membership row; confirm middleware redirects to `/pending-membership`.

### GAP-D06 · RLS on all new tables
- **Tables:** machines, diagnostic_trees, diagnostic_nodes, diagnostic_sessions, learning_modules, learning_blocks, machine_manuals.
- **Pattern:** Same as existing documents/steps/document_changelog tables:
  1. `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;`
  2. SELECT policy: `company_id IN (SELECT company_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')`
  3. INSERT policy: same membership check + role IN ('owner','admin','author')
  4. UPDATE/DELETE policy: same + role IN ('owner','admin') OR (role = 'author' AND created_by = auth.uid())
- **Verification:** With a viewer-role auth token, confirm INSERT to `machines` returns 403.

---

## Layer 3 — Storage & file upload

### GAP-F01 · Supabase Storage bucket wiring
- **Source evidence:** Source uses `base44.integrations.Core.UploadFile` which writes to Base44 storage and returns a URL. Target has no equivalent wired.
- **Target files to create:**
  - `src/lib/storage.ts` — `uploadFile(bucket: string, path: string, file: File): Promise<string>` using `supabase.storage.from(bucket).upload(path, file)` + `getPublicUrl`.
- **Supabase:** Create bucket `documents` (public) via Supabase dashboard or migration if MCP supports it.
- **Verification:** Upload a test PNG via the function; confirm public URL resolves.

### GAP-F02 · Puppeteer PDF generation wired
- **Source evidence:** bulkExportSOPs function generates per-SOP PDF with jsPDF. Target has no PDF generation.
- **Target files:** `src/lib/pdf.ts` — `generateDocumentPDF(doc: Document, steps: Step[]): Promise<Buffer>` using existing `puppeteer` dep (confirmed in package.json during audit).
- **Template:** render document title, department, machine, machine_area, version, status, critical_safety_info, safety reminders, description, required_tools[], numbered steps (instruction + notes + safety_warning + image placeholder).
- **Verification:** Unit-call the function; confirm Buffer is valid PDF (first bytes are `%PDF`).

---

## Layer 4 — Backend route handlers

### GAP-C01 · POST /api/export/bulk
- **Source evidence:** bulkExportSOPs/entry.ts — input `{sopIds: string[]}`, generates jsPDF per SOP, packages into JSZip, returns `application/zip`.
- **Target file to create:** `src/app/api/export/bulk/route.ts`
  ```
  POST body: { documentIds: string[] }
  Auth: require session (service-role supabase for fetch)
  Per document: call generateDocumentPDF(doc, steps)
  Bundle: zip all PDFs, filename = `${doc.title}.pdf`
  Response: 200 application/zip, Content-Disposition: attachment; filename=export.zip
  ```
- **Verification:** POST with 2 doc IDs; confirm response Content-Type is `application/zip` and zip contains 2 PDFs.

### GAP-C02 · POST /api/import/excel
- **Source evidence:** extractSopFromExcel/entry.ts — fetches Excel file URL, parses with xlsx (XLSX.read + sheet_to_json), maps rows [instruction, notes, safetyWarningText] to steps, creates SOP with base_title from filename.
- **Target file to create:** `src/app/api/import/excel/route.ts`
  ```
  POST body: multipart/form-data with file field
  Parse with xlsx library (add to package.json if absent)
  Map rows: instruction=col[0], notes=col[1], safety_warning=(col[2]==='TRUE'||col[2]==='Yes')
  Create documents row + steps rows in Supabase
  Response: { documentId: string }
  ```
- **Deps:** Add `xlsx` to package.json if not present.
- **Verification:** POST a 3-row XLSX; confirm document + 3 steps created in DB.

### GAP-C03 · GET /api/public/document/[id]
- **Source evidence:** getPublicSOP/entry.ts — no auth, uses service role, returns 403 if status not Approved/Published.
- **Target file to create:** `src/app/api/public/document/[id]/route.ts`
  ```
  GET — no auth required
  Fetch document with service-role supabase
  If status not in ['Approved'] → return 403 { error: 'Not available' }
  Return { document, steps }
  ```
- **Verification:** GET an Approved doc → 200 with data. GET a Draft doc → 403.

### GAP-C04 · POST /api/import/diagnostic-tree
- **Source evidence:** importDiagnosticTree/entry.ts — input `{file_url}` (PDF), calls ExtractDataFromUploadedFile with detailed JSON schema, two-pass node creation.
- **Target file to create:** `src/app/api/import/diagnostic-tree/route.ts`
  ```
  POST body: multipart/form-data with pdf field
  Upload PDF to Supabase Storage (reuse storage.ts)
  Call Anthropic API (claude-sonnet-4-6) with file URL and extraction prompt
  Parse JSON schema: tree_info + diagnostic_flow[]
  Two-pass: INSERT all nodes without options, then UPDATE options with resolved IDs
  Set root_node_id to first created node
  Response: { treeId: string }
  ```
- **Deps:** `@anthropic-ai/sdk` (add to package.json if absent); ANTHROPIC_API_KEY env var.
- **Verification:** POST a sample diagnostic PDF; confirm tree + nodes in DB with options correctly linked.

### GAP-C05 · Resend email on status change
- **Source evidence:** Source sends email via SendEmail integration when SOP status changes (email_settings.recipients[]).
- **Target file to create:** `src/lib/email.ts`
  - `sendStatusChangeEmail(doc: Document, newStatus: string, recipients: string[]): Promise<void>` using Resend SDK.
  - Template: subject `[TaskPathway] "${doc.title}" is now ${newStatus}`, body includes doc title, new status, link to view.
- **Modify:** `src/components/tasks/TaskEditor.tsx` — after status change recordChange call, call `sendStatusChangeEmail` if `doc.notification_emails.length > 0`.
- **Deps:** `resend` package (confirm in package.json); RESEND_API_KEY env var.
- **Verification:** Approve a doc with notification_emails set; confirm email received (or Resend log shows send).

### GAP-C06 · POST /api/ai/generate-steps
- **Source evidence:** Source uses InvokeLLM integration to generate SOP steps from a title/description prompt.
- **Target file to create:** `src/app/api/ai/generate-steps/route.ts`
  ```
  POST body: { title: string, description: string, documentType: string }
  Call Anthropic claude-sonnet-4-6 with structured prompt asking for numbered steps
  Return: { steps: Array<{ instruction_text: string, warning_text?: string }> }
  ```
- **Verification:** POST `{ title: 'Change oil', documentType: 'Task' }`; confirm response contains an array of step objects.

### GAP-C08 · POST /api/stripe/webhook
- **Source evidence:** Target has Stripe billing integration (Stripe plans in pricing). No webhook handler confirmed during audit.
- **Target file to create:** `src/app/api/stripe/webhook/route.ts`
  ```
  Verify Stripe-Signature header using STRIPE_WEBHOOK_SECRET
  Handle events:
    checkout.session.completed → update companies.plan + companies.task_limit
    customer.subscription.updated → update plan
    customer.subscription.deleted → downgrade to 'free', set task_limit=5
  ```
- **Deps:** `stripe` package; STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET env vars.
- **Verification:** Use Stripe CLI `stripe listen --forward-to localhost:3000/api/stripe/webhook`; fire test event; confirm companies row updated.

### GAP-F03 · Resend wired end-to-end
- **Covered by C05 above** — confirm RESEND_API_KEY documented in .env.example.

### GAP-F04 · Anthropic ExtractDataFromUploadedFile
- **Covered by C04 above** — ANTHROPIC_API_KEY needed.

### GAP-F05 · Anthropic InvokeLLM
- **Covered by C06 above.**

### GAP-F06 · Stripe subscription
- **Covered by C08 above** — also confirm `src/app/api/stripe/create-checkout/route.ts` exists and returns a Stripe Checkout session URL.
- **Verification:** Confirm route returns `sessionUrl` for each plan tier.

---

## Layer 5 — Core editor fixes

### GAP-C07 · File upload in StepsEditor (currently plain text inputs)
- **Source evidence:** Source uses UploadFile integration; StepsEditor.tsx uses `<input type="text">` for image_url and video_url.
- **Target file to modify:** `src/components/tasks/StepsEditor.tsx`
  - Replace image_url text input with `<input type="file" accept="image/*">` + preview.
  - Replace video_url text input with `<input type="file" accept="video/*">` + filename display, OR keep URL input but add an upload alternative.
  - On file select: call `uploadFile('documents', `steps/${stepId}/${filename}`, file)` from storage.ts; write returned URL into step.image_url / step.video_url.
- **Verification:** Upload a PNG in StepsEditor; confirm step.image_url in DB is a valid Supabase Storage URL.

### PARTIAL-A05 / C05b · TaskEditor save: applicable_machines + notification_emails
- **Target file:** `src/components/tasks/TaskEditor.tsx`
- **Change:** In `documentData` object inside `handleSave()`, add:
  ```ts
  applicable_machines: formData.applicable_machines ?? [],
  notification_emails: formData.notification_emails ?? [],
  base_title: formData.base_title || formData.title,
  machine: formData.machine,
  machine_area: formData.machine_area,
  ```
- Also add form fields for `applicable_machines` (multi-select or tag input), `notification_emails` (tag input), `machine`, `machine_area`.
- **Verification:** Create a doc with applicable_machines=['M1','M2']; confirm DB row has the array.

### GAP-A08b · steps.notes field in StepsEditor
- **Target file:** `src/components/tasks/StepsEditor.tsx`
- **Change:** Add `notes` textarea field to each step card (after instruction_text, before warning_text).
- **Verification:** Save a step with notes; confirm steps.notes in DB.

### GAP-B06a · video_captions in InteractiveViewer
- **Source evidence:** SOP step has `video_captions[]` with time/duration/text/position. InteractiveViewer.tsx has no caption rendering.
- **Target file:** `src/components/tasks/InteractiveViewer.tsx`
- **Change:** During video playback, listen to `timeupdate` event; filter `step.video_captions` where `time <= currentTime < time+duration`; overlay matching captions as absolutely-positioned `<div>` using `position.x`, `position.y` as percentages.
- **Verification:** Attach a caption at t=2s to a video step; play past 2s; confirm caption appears.

### GAP-B06b · requires_acknowledgement hard gate
- **Source evidence:** Source pre-procedure screen requires both safety acknowledgement AND tools checklist before proceeding. InteractiveViewer allows navigation past without completing.
- **Target file:** `src/components/tasks/InteractiveViewer.tsx`
- **Change:** For steps where `step.requires_acknowledgement === true`, disable the "Next" button until user checks the acknowledgement checkbox for that step.
- **Verification:** Set requires_acknowledgement=true on step 1; confirm Next is disabled until box is checked.

---

## Layer 6 — Library / navigation fixes

### GAP-E04 · machine filter in library
- **Target file:** `src/app/(app)/library/page.tsx`
- **Change:** Add `machine` filter state + `<select>` (populated from distinct machines in documents). Apply `.eq('machine', selectedMachine)` to query when set.
- **Verification:** Set machine='Filler A'; confirm only Filler A docs returned.

### GAP-E10 / E11 · applicable_machines in search + dual-field machine check
- **Target file:** `src/app/(app)/library/page.tsx`
- **Change:** Extend client-side search filter to also check `doc.applicable_machines?.some(m => m.toLowerCase().includes(q))`.
- **Change 2:** Machine filter should match `doc.machine === selectedMachine || doc.applicable_machines?.includes(selectedMachine)`.
- **Verification:** Create doc with applicable_machines=['M2'] and machine=null; search 'M2'; confirm doc appears.

### GAP-E09 · hierarchical department → machine → area browse
- **Source evidence:** SOPLibrary.jsx has `selectedDepartment` → `selectedMachine` → `selectedArea` state chain.
- **Target file:** `src/app/(app)/library/page.tsx`
- **Change:** Add three cascading state values. Dept select populates from distinct `department` values. Machine select filters to machines in selected dept. Area select filters to machine_area values for selected machine. Each selection narrows the document list.
- **Verification:** Select dept='Production'; confirm only Production docs shown. Then select machine; confirm further narrowed.

### GAP-E02 · Active DiagnosticTrees in library
- **Target file:** `src/app/(app)/library/page.tsx`
- **Change:** Add a DiagnosticTrees section fetching `diagnostic_trees` where `status='Active'`, displayed as cards linking to `/diagnostic/[id]`.
- **Verification:** Create an Active tree; confirm it appears in library.

### GAP-E03 · Approved MachineManuals in library
- **Target file:** `src/app/(app)/library/page.tsx`
- **Change:** Add a MachineManuals section fetching `machine_manuals` where `status='Approved'`, displayed as cards with file download link.
- **Verification:** Create an Approved manual with file_url; confirm it appears with download link.

---

## Layer 7 — Business-logic gates

### GAP-E15 · Plan limit enforcement on document create
- **Source evidence:** companies table has `task_limit` column. Free plan = 5 documents.
- **Target files to modify:**
  - `src/app/api/documents/route.ts` (or wherever POST /api/documents is handled) — before INSERT, run:
    ```ts
    const count = await supabase.from('documents').select('id', { count: 'exact' }).eq('company_id', companyId);
    const limit = company.task_limit ?? 5;
    if (count >= limit) return 409 { error: 'Plan limit reached' };
    ```
  - `src/app/(app)/library/page.tsx` or TaskEditor — show upgrade prompt when 409 received.
- **Verification:** Set task_limit=2 on company; create 2 docs; attempt 3rd; confirm 409 + upgrade prompt.

### GAP-E06 · Admin-only soft-delete (active=false)
- **Source evidence:** Source allows admin-only delete of SOPs. Target has no delete action.
- **Target files:**
  - Add `active BOOLEAN DEFAULT TRUE` column to documents if not present.
  - Add delete/archive button in `src/components/tasks/TaskEditor.tsx` (visible only to owner/admin).
  - On click: confirm dialog → `UPDATE documents SET active=false` (soft delete).
  - Library query must add `.eq('active', true)` filter.
- **Verification:** Admin archives doc; confirm it disappears from library. Confirm non-admin sees no delete button.

### GAP-E14 · LearningModule passing_score enforcement
- **Source evidence:** LearningModule has `passing_score` (default 80). ModuleRunner must refuse completion if quiz score < passing_score.
- **Target file:** `src/app/(app)/learning/[moduleId]/page.tsx` (to be created in Layer 8).
- **Change:** At quiz completion, calculate `score = (correct/total)*100`; if `score < module.passing_score` → show "Not passed" state with retry option rather than completion screen.
- **Verification:** Set passing_score=80; answer 50% correctly; confirm not-passed screen shown.

### GAP-E13 · DiagnosticTree two-pass node linking
- **Source evidence:** importDiagnosticTree uses two-pass: first create all nodes, then update options with resolved next_node_id.
- **Covered by C04 above.** Implementation must strictly follow two-pass pattern — do not wire options in the first pass.

---

## Layer 8 — New full pages

All pages below are new routes. Each follows the same scaffold:
1. Create route directory under `src/app/(app)/`.
2. Create `page.tsx` with auth + membership guard.
3. Create necessary child components under `src/components/`.
4. Wire Supabase queries against the tables created in Layer 0.

### GAP-B09 · AssetManager page (`/asset-manager`)
- **Source evidence:** AssetManager.jsx — CRUD for Machine entities, grouped by department, toggle active, Load Default Machines seed.
- **Target files:**
  - `src/app/(app)/asset-manager/page.tsx`
  - `src/components/machines/MachineDialog.tsx` (create/edit form)
  - `src/lib/machine-seeds.ts` (DEFAULT_MACHINE_SEED data)
- **Access:** owner/admin only.
- **Features:** List machines grouped by department. Add/edit/delete machine. Toggle active. Load defaults button.

### GAP-B10 · DiagnosticEditor page (`/diagnostic/editor/[id]`)
- **Source evidence:** DiagnosticEditor.jsx — visual node graph editor for DiagnosticTree.
- **Target files:**
  - `src/app/(app)/diagnostic/editor/[id]/page.tsx`
  - `src/components/diagnostic/NodeCanvas.tsx`
  - `src/components/diagnostic/NodeCard.tsx`
- **Features:** Create/edit question, action, result, info nodes. Draw option connections. Set root node. Save tree.

### GAP-B11 · DiagnosticRunner page (`/diagnostic/run/[id]`)
- **Source evidence:** DiagnosticRunner.jsx — interactive walkthrough following node graph.
- **Target files:**
  - `src/app/(app)/diagnostic/run/[id]/page.tsx`
  - `src/components/diagnostic/DiagnosticRunner.tsx`
- **Features:** Load tree, start at root_node_id, render node by type, follow selected option to next_node_id, record DiagnosticSession.

### GAP-B12 · DiagnosticImporter page (`/diagnostic/import`)
- **Source evidence:** DiagnosticImporter.jsx — PDF upload → calls importDiagnosticTree backend.
- **Target files:**
  - `src/app/(app)/diagnostic/import/page.tsx`
- **Features:** File picker (PDF), upload button, calls POST /api/import/diagnostic-tree, shows result tree link.

### GAP-B13 · FaultFinding page (`/fault-finding`)
- **Source evidence:** FaultFinding.jsx — browse DiagnosticTrees filtered by machine/department, launch DiagnosticRunner.
- **Target files:**
  - `src/app/(app)/fault-finding/page.tsx`
- **Features:** List Active trees. Filter by machine, department. Card links to DiagnosticRunner.

### GAP-B14 · LearningStudio page (`/learning`)
- **Source evidence:** LearningStudio.jsx — admin list of LearningModules, create/edit/archive.
- **Target files:**
  - `src/app/(app)/learning/page.tsx`
- **Access:** owner/admin only.
- **Features:** CRUD for learning_modules. Status badge. Link to ModuleEditor.

### GAP-B15 · ModuleEditor page (`/learning/editor/[id]`)
- **Source evidence:** ModuleEditor.jsx — drag-and-drop block editor for LearningBlocks.
- **Target files:**
  - `src/app/(app)/learning/editor/[id]/page.tsx`
  - `src/components/learning/BlockEditor.tsx`
- **Features:** Add/reorder/edit blocks by type. content_data form varies by block_type.

### GAP-B16 · ModuleRunner page (`/learning/run/[id]`)
- **Source evidence:** ModuleRunner.jsx — step through blocks, quiz scoring, completion.
- **Target files:**
  - `src/app/(app)/learning/run/[id]/page.tsx`
  - `src/components/learning/ModuleRunner.tsx`
- **Features:** Block-by-block display. Quiz scoring. passing_score gate (see E14).

### GAP-B17 · ManualEditor page (`/manuals/editor/[id]`)
- **Source evidence:** ManualEditor.jsx — create/edit MachineManual metadata + file upload.
- **Target files:**
  - `src/app/(app)/manuals/editor/[id]/page.tsx`
  - `src/components/manuals/ManualForm.tsx`
- **Features:** Form for all MachineManual fields. File upload (PDF) via storage.ts. Save/publish/archive.

### GAP-B18 · ManualViewer page (`/manuals/[id]`)
- **Source evidence:** ManualViewer.jsx — display approved manual PDF in iframe + metadata.
- **Target files:**
  - `src/app/(app)/manuals/[id]/page.tsx`
- **Features:** Fetch manual by ID (status check: Approved only for non-admins). Render PDF in `<iframe>`. Show metadata sidebar.

### GAP-B19 · Pending-membership page
- **Covered by D04 in Layer 2.**

---

## Layer 9 — Admin utilities

### GAP-E16 / B08 · Admin activity register page (`/admin/register`)
- **Source evidence:** AdminRegister.jsx — lists all SOPs with updated_date, created_by, status, department, version. Period filters: today/week/month/all. Access: user.role==='admin' OR email whitelist.
- **Target files:**
  - `src/app/(app)/admin/register/page.tsx`
- **Access:** owner/admin role check server-side.
- **Features:** Table of all documents (not filtered by active). Period filters. Export to CSV button.
- **Verification:** Admin visits /admin/register; confirm all documents listed including archived.

### GAP-B23 · "View As Role" admin preview
- **Source evidence:** Layout.jsx — admin-only dropdown using sessionStorage to impersonate a role for UI preview.
- **Target file:** `src/components/layout/Sidebar.tsx` (or equivalent layout file).
- **Change:** Add role-selector dropdown visible only to owner/admin. Store selection in sessionStorage key `tp_view_as_role`. All role-gate checks in the layout read from this key first before the real membership role.
- **Verification:** Admin selects "viewer"; confirm Create button disappears from library without actually changing their role.

### GAP-B07 · ChangelogClient feature completeness
- **Source evidence:** ChangeLog.jsx — expandable entries, stats (total/SOPs tracked/approvals/status changes), filters (search by title/summary/user, change_type dropdown).
- **Target file:** `src/app/(app)/changelog/page.tsx` (or ChangelogClient component).
- **PARTIAL gap:** Confirm stats cards and search/filter are present. Add missing: expandable rows showing changed_fields[], step count delta, version, status transition arrows.
- **Verification:** Create 3 changelog entries with different change_types; confirm stats correct; search by changed_by_name; confirm filter narrows results.

### GAP-B05 · Mobile editor assessment
- **Source evidence:** SOPEditorMobile route in App.jsx.
- **Assessment needed:** Read `src/app/(app)/` to see if a mobile-specific editor route exists. If not, confirm whether TaskPathway intends responsive design instead (🔵) or needs a dedicated mobile route (❌).
- **Action:** Read the route structure before writing any code; update matrix if this resolves to 🔵.

### GAP-E17 · Machine seed defaults
- **Source evidence:** AssetManager uses DEFAULT_MACHINE_SEED from useSiteConfig.
- **Covered by B09** — `src/lib/machine-seeds.ts` exports the default set.

---

## Layer 10 — Final sweep (Phase 5)

After all implementation batches are committed:
1. Re-open every file cited in the PARITY_MATRIX.md evidence column.
2. Confirm the implemented behaviour matches the source behaviour.
3. Run `npx tsc --noEmit` and `next build` and confirm zero errors.
4. Update every matrix row that changed status.
5. Write final report: total rows, parity %, remaining non-green rows with justification.
6. Zero ❓ UNCLEAR rows permitted in final state.

---

## Batch order for Phase 4

Implement in this exact sequence (one batch = one commit):

| Batch | Row(s) | Description |
|-------|--------|-------------|
| 01 | A02,A03,A05,A06,A08,A04 | documents + steps column migrations |
| 02 | A17 | machines table migration |
| 03 | A11,A12,A13 | diagnostic tables migration |
| 04 | A14,A15 | learning tables migration |
| 05 | A16 | machine_manuals table migration |
| 06 | D06 | RLS on all new tables |
| 07 | A24 | types.ts sync |
| 08 | F01 | storage.ts upload utility |
| 09 | F02 | pdf.ts generation utility |
| 10 | D04,B19 | pending-membership page + middleware |
| 11 | C03 | GET /api/public/document/[id] |
| 12 | C06,F05 | POST /api/ai/generate-steps |
| 13 | C02 | POST /api/import/excel |
| 14 | C04,F04,E13 | POST /api/import/diagnostic-tree (two-pass) |
| 15 | C08,F06 | POST /api/stripe/webhook |
| 16 | C05,F03 | Resend email on status change |
| 17 | C01 | POST /api/export/bulk |
| 18 | C07 | StepsEditor file upload |
| 19 | A05b,A06b,A08b | TaskEditor: save applicable_machines/notification_emails/machine/machine_area; add notes field |
| 20 | B06a | InteractiveViewer: video captions |
| 21 | B06b | InteractiveViewer: requires_acknowledgement hard gate |
| 22 | E04,E10,E11 | Library: machine filter + applicable_machines search |
| 23 | E09 | Library: hierarchical browse |
| 24 | E02,E03 | Library: DiagnosticTrees + MachineManuals sections |
| 25 | E15 | Plan limit enforcement |
| 26 | E06 | Soft-delete (admin only) |
| 27 | B09,E17 | AssetManager page + machine seeds |
| 28 | B10 | DiagnosticEditor page |
| 29 | B11 | DiagnosticRunner page |
| 30 | B12 | DiagnosticImporter page |
| 31 | B13 | FaultFinding page |
| 32 | B14 | LearningStudio page |
| 33 | B15 | ModuleEditor page |
| 34 | B16,E14 | ModuleRunner page + passing_score gate |
| 35 | B17 | ManualEditor page |
| 36 | B18 | ManualViewer page |
| 37 | E16,B08 | Admin activity register page |
| 38 | B23 | View-As-Role admin preview |
| 39 | B07 | ChangelogClient feature completeness |
| 40 | B05 | Mobile editor assessment → resolve to 🔵 or implement |
| 41 | — | Phase 5 final sweep |

---

*This plan covers all 41 ❌ GAP and 14 🟡 PARTIAL rows from PARITY_MATRIX.md.*  
*Awaiting user go-ahead to begin Phase 4 — Batch 01.*
