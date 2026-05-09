# Replit Prompt: Multi-Layer Scientific Publication Platform

Build a full-stack web application for a scientific publication platform with multi-layer verification workflow. Use **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL + NextAuth.js**.

---

## Core Concept

A platform where researchers submit scientific papers that go through a multi-stage verification pipeline (AI + human reviewers) before being published publicly.

---

## User Roles & Permissions

1. **Guest** (unauthenticated)
   - Browse/search published papers
   - Read abstracts and download published PDFs
   - View author profiles

2. **User / Author** (authenticated)
   - All Guest permissions
   - Submit new papers (PDF + metadata)
   - Track submission progress in real-time
   - Respond to revision requests
   - View their own submission history

3. **Verifier** (assigned to a specific layer)
   - Layer 2 Verifier: Reviews content quality, methodology, structure
   - Layer 3 Verifier: Final senior review, scientific contribution, ethics
   - Approve / Reject / Request Revisions with comments

4. **Admin**
   - Full system access
   - Assign verifiers to papers
   - Manage user roles
   - Override decisions
   - View analytics dashboard

---

## Submission Workflow (State Machine)

Implement these statuses with strict transitions:

```
DRAFT → SUBMITTED → AI_REVIEW (Layer 1)
  ↓
AI_PASSED → LAYER_2_REVIEW → LAYER_2_APPROVED → LAYER_3_REVIEW → LAYER_3_APPROVED → PUBLISHED
  ↓ (at any layer)
REVISION_REQUESTED → (back to author) → RESUBMITTED → (re-enters appropriate layer)
  ↓ (at any layer)
REJECTED (terminal)
```

---

## Verification Layers — Detailed

### Layer 1: AI Verification (Automated)

On submission, automatically run checks using the Anthropic Claude API:

- **Grammar & punctuation check** — flag errors with location
- **AI-generated content detection** — estimate % likelihood the text was AI-written
- **Plagiarism similarity** — basic n-gram comparison against existing papers in DB
- **Structural completeness** — checks for Abstract, Introduction, Methodology, Results, Conclusion, References
- **Citation format validity** — APA/IEEE format check
- **Minimum word count** (e.g., 3000 words)

Output: a JSON report with `score`, `passed: boolean`, and `issues[]`. Auto-pass if score ≥ 75 and no critical issues; otherwise auto-reject with detailed report shown to author.

### Layer 2: Content Reviewer (Human)

- Reviews methodology soundness
- Checks data analysis correctness
- Evaluates clarity of writing
- Provides inline comments on PDF
- Decision: Approve / Revise / Reject

### Layer 3: Senior Reviewer (Human)

- Evaluates scientific contribution & novelty
- Ethics compliance check
- Final publication decision
- Assigns DOI on approval

---

## Database Schema (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  role          Role     @default(USER)
  verifierLayer Int?     // 2 or 3, null for non-verifiers
  affiliation   String?
  orcidId       String?
  papers        Paper[]  @relation("Author")
  reviews       Review[]
  createdAt     DateTime @default(now())
}

enum Role { GUEST USER VERIFIER ADMIN }

model Paper {
  id              String   @id @default(cuid())
  title           String
  abstract        String   @db.Text
  keywords        String[]
  category        String   // e.g., "Computer Science", "Biology"
  pdfUrl          String
  authorId        String
  author          User     @relation("Author", fields: [authorId], references: [id])
  coAuthors       String[] // names + emails as JSON
  status          PaperStatus @default(DRAFT)
  currentLayer    Int      @default(0)
  doi             String?  @unique
  publishedAt     DateTime?
  aiReport        Json?
  reviews         Review[]
  statusHistory   StatusHistory[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum PaperStatus {
  DRAFT
  SUBMITTED
  AI_REVIEW
  AI_PASSED
  AI_FAILED
  LAYER_2_REVIEW
  LAYER_2_APPROVED
  LAYER_3_REVIEW
  LAYER_3_APPROVED
  PUBLISHED
  REVISION_REQUESTED
  REJECTED
}

model Review {
  id          String   @id @default(cuid())
  paperId     String
  paper       Paper    @relation(fields: [paperId], references: [id])
  reviewerId  String
  reviewer    User     @relation(fields: [reviewerId], references: [id])
  layer       Int      // 2 or 3
  decision    Decision
  comments    String   @db.Text
  inlineNotes Json?    // array of {page, position, note}
  createdAt   DateTime @default(now())
}

enum Decision { APPROVED REJECTED REVISION }

model StatusHistory {
  id         String       @id @default(cuid())
  paperId    String
  paper      Paper        @relation(fields: [paperId], references: [id])
  fromStatus PaperStatus?
  toStatus   PaperStatus
  changedBy  String
  note       String?
  createdAt  DateTime     @default(now())
}
```

---

## Key Pages & Features

### Public Pages

- `/` — Landing page with featured papers, search bar, statistics
- `/browse` — Paginated list of published papers with filters (category, year, keywords)
- `/papers/[id]` — Public paper detail view with abstract + PDF preview
- `/auth/signin` & `/auth/signup` — Auth pages

### Author Dashboard (`/dashboard`)

- "My Submissions" — list with current status badge
- "Submit New Paper" form (multi-step: metadata → upload PDF → review → submit)
- **Progress Tracker Component** — visual horizontal stepper showing all stages with timestamps. Use distinct icons/colors: ⏳ pending, ✅ approved, ❌ rejected, 🔄 in revision. Each step is clickable to expand details (reviewer comments, AI report).

### Verifier Dashboard (`/verifier`)

- Queue of papers assigned to their layer
- Paper review interface: PDF viewer + comment panel + decision buttons
- Inline annotation tool

### Admin Dashboard (`/admin`)

- User management table (change roles, assign verifier layers)
- Paper assignment interface (assign Layer 2/3 reviewers)
- Analytics: submissions over time, avg review time, acceptance rate
- System settings

---

## Tech Implementation Details

- **PDF storage**: Use UploadThing or local `/public/uploads` for MVP
- **PDF preview**: `react-pdf` library
- **AI integration**: Anthropic Claude API for Layer 1 automated checks. Use `claude-sonnet-4-5` model.
- **Email notifications**: Resend (status changes, review assignments)
- **Real-time updates**: Server-Sent Events or polling for the progress tracker
- **Search**: PostgreSQL full-text search on title + abstract + keywords
- **Auth**: NextAuth.js with credentials + Google provider

---

## UI/UX Requirements

- Clean academic aesthetic — serif fonts for paper content (e.g., Lora), sans-serif for UI (Inter)
- Color palette: deep navy primary, white background, accent gold for highlights
- Fully responsive (mobile, tablet, desktop)
- Dark mode toggle
- Use shadcn/ui components for consistency
- Status badges with color coding:
  - Yellow: in review
  - Green: approved/published
  - Red: rejected
  - Blue: revision requested

---

## Seed Data Requirements

Create a seed script (`prisma/seed.ts`) that populates the database with the following dummy data:

### Admin (1)

- **Name:** System Admin
- **Email:** admin@scipub.com
- **Role:** ADMIN

### Verifiers (3) — IMPORTANT: use these exact names

**Layer 2 Verifiers (Content Reviewers):**

1. **Firman Fajar Perdana**
   - Email: firman.perdana@scipub.com
   - Role: VERIFIER
   - verifierLayer: 2
   - Affiliation: Faculty of Computer Science

2. **Wikan**
   - Email: wikan@scipub.com
   - Role: VERIFIER
   - verifierLayer: 2
   - Affiliation: Department of Information Systems

**Layer 3 Verifier (Senior Reviewer):**

3. **Grandis**
   - Email: grandis@scipub.com
   - Role: VERIFIER
   - verifierLayer: 3
   - Affiliation: Research & Publication Board

### Sample Authors (3)

- Three regular USER accounts (e.g., Andi Pratama, Siti Nurhaliza, Budi Santoso) with realistic affiliations.

### Sample Papers (5)

Create 5 sample papers in **various states** of the workflow to demonstrate the full pipeline:

1. One in `AI_REVIEW`
2. One in `LAYER_2_REVIEW` (assigned to Firman Fajar Perdana or Wikan)
3. One in `LAYER_3_REVIEW` (assigned to Grandis)
4. One in `REVISION_REQUESTED`
5. One `PUBLISHED` (with DOI assigned by Grandis)

Include realistic titles, abstracts, keywords, and corresponding `StatusHistory` and `Review` entries so the progress tracker has real data to display.

---

## Deliverables

1. Set up the Next.js project with all dependencies installed
2. Configure Prisma with the schema above and run initial migration
3. Implement the seed script described above with the **exact verifier names: Firman Fajar Perdana, Wikan (Layer 2), and Grandis (Layer 3)**
4. Build all pages and APIs listed above
5. Implement Layer 1 AI verification function (mock the AI call initially with realistic JSON output, then wire to Claude API)
6. Add `.env.example` with all required variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`)
7. Include a README with setup instructions and seed-account credentials

---

## Build Order

Start by scaffolding the project, setting up the database, and building the authentication + role system first. Then build the submission flow, then the verifier dashboards, then admin. Confirm each milestone before moving to the next.
