# Niti Pharma

A **demonstration** web application for a B2B pharmaceutical distributor. It combines a **public marketing site** (catalog, coverage, compliance, contact) with a **signed-in platform workspace** for orders, shipments, documents, exceptions, reconciliation, billing, and reporting.

> **Scope:** Portfolio and product-demo quality. Platform data is simulated for illustration unless you connect your own database and services.

---

## What’s included

| Area | Description |
|------|-------------|
| **Marketing site** | Landing page, searchable product catalog (static JSON), coverage map, compliance content, and contact form. |
| **Platform workspace** | Dashboard, orders, tracking, document upload with OCR/AI extraction, exception handling, three-way reconciliation, reports, billing, and customer views. |
| **Backend** | Next.js Route Handlers, **PostgreSQL** via **Prisma**, optional **Supabase Auth**, file storage on **Cloudflare R2**, email via **Resend**, and optional **Anthropic** for document extraction. |

---

## Tech stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript  
- **UI:** Tailwind CSS, Radix UI / shadcn-style components, Framer Motion, Lucide icons  
- **Data:** Prisma ORM, PostgreSQL  
- **Auth:** Supabase (middleware refreshes session when `NEXT_PUBLIC_SUPABASE_*` is set)  
- **Forms:** React Hook Form + Zod  
- **Tables & charts:** TanStack Table, Recharts  

---

## Prerequisites

- **Node.js 18+**
- **npm**, **pnpm**, or **yarn**
- **PostgreSQL** (for platform APIs and Prisma; marketing pages can load without a DB if you only browse static routes)

---

## Local setup

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd Niti_Pharma
   npm install
   ```

2. **Environment variables**

   Create a `.env` file in the project root. Use the following as a checklist; omit keys you do not need for the slice you are running.

   | Variable | Purpose |
   |----------|---------|
   | `DATABASE_URL` | PostgreSQL connection string for Prisma |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (auth/session) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME` | Document uploads to R2 |
   | `RESEND_API_KEY` | Contact form and invoice reminder email |
   | `RESEND_FROM` | Verified sender address for Resend |
   | `ANTHROPIC_API_KEY` | AI-assisted extraction in the document pipeline |
   | `NEXT_PUBLIC_COMPANY_NAME` | Optional; defaults in billing emails |

   If Supabase variables are missing, middleware skips Supabase setup and the app still runs for local static browsing.

3. **Database**

   ```bash
   npx prisma migrate dev
   # or, for a quick local schema push:
   npm run db:push
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and start |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma migrate (development) |
| `npm run db:push` | Push schema without migrations |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run generate:platform-data` | Regenerate platform-related data (see `scripts/`) |

---

## Project layout (high level)

```
app/
  (platform)/          # Workspace: dashboard, orders, documents, etc.
  api/                 # REST-style Route Handlers
  catalog/             # Public catalog
  compliance/, coverage/, contact/
components/            # Shared UI and feature components
data/                  # Static JSON (e.g. products, coverage)
lib/                   # Data helpers, Prisma, R2, pipelines, etc.
prisma/                # schema.prisma and migrations
public/                # Static assets, PWA service worker
```

Platform navigation and feature descriptions are centralized in `lib/platform-nav.ts`.

---

## Deployment

Deploy like any Next.js app (for example **Vercel**). Set the same environment variables in the hosting provider. Ensure `DATABASE_URL` points to a production PostgreSQL instance and run migrations against it before going live.

---

## Demo limitations

- The workspace banner states that **data is simulated** for demonstration unless you supply real integrations.
- **No production ERP guarantee:** flows are designed to showcase UX and architecture, not to replace licensed pharmacy software without review.
- **Contact email** requires `RESEND_API_KEY` (and a verified domain/sender) to deliver; otherwise the API responds with an error you can see in server logs.

---

## License

This repository is intended as a **demo / portfolio** project. Add a license file if you redistribute or commercialize it.

---

## Contributing

Issues and pull requests are welcome. Please keep changes focused and consistent with existing patterns in the codebase.
