# CodePulse

**Turn production failures into reusable engineering knowledge.**

CodePulse is an incident-memory web application. Engineers submit a production stack trace; the server compares it with resolved incidents using local text similarity, correlates linked Git commit records, and builds a structured rule-based RCA and post-mortem. Drafts can be edited, saved to PostgreSQL, copied, and downloaded. The free demo does not require an AI provider or paid subscription.

Seeded incidents and commit metadata are fictional demo records for this hackathon project. Their commit links are stored records, not a live GitHub integration.

## Architecture

```text
Browser
  -> Next.js server route
  -> local text-similarity search
  -> Supabase incident and commit records
  -> related git_commits rows
  -> local rule-based RCA and post-mortem templates
  -> incidents + ai_telemetry + postmortems in Supabase
```

The Supabase service-role key and OpenAI key are only read by server routes and the seed script. Browser code communicates with the application API; it never receives these credentials.

## Requirements

- Node.js 20+
- npm
- A Supabase project
- No AI-provider key is required for the free demo
- A random `DEMO_AUTH_SECRET` is required in production for signed admin sessions

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root, using `.env.example` as a template:

   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SIDE_SERVICE_ROLE_KEY
   DEMO_AUTH_SECRET=YOUR_RANDOM_SESSION_SIGNING_SECRET
   ```

   Keep `.env.local` private. It is excluded by `.gitignore`. Never put the service-role or OpenAI key in a `NEXT_PUBLIC_` variable or in browser code.

The login uses the public demo credentials shown on the login screen. This is an evaluation gate only, not production-grade identity or access control; do not store real or sensitive incident data in this demo.

3. In the Supabase dashboard, open **SQL Editor**, paste and run [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) to create the tables and indexes.

4. Demo incidents and linked sample commits are inserted automatically the first time you open Incidents, Analytics, or Analyze. To insert them manually:

   ```bash
   npm run seed
   ```

   Seeding is repeatable and does not call an embedding or AI service.

5. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Select **Incident Intelligence**, click **Load Demo Incident**, then **Analyze Incident**.

## Database tables

- `incidents`: operational incidents, status, root cause, and resolution. Embeddings are unused by the free demo.
- `git_commits`: commit metadata linked to an incident by foreign key.
- `postmortems`: generated, editable post-mortems saved as structured columns.
- `ai_telemetry`: AI feature/model, SHA-256 prompt hash, response status, latency, and token usage. Raw prompts and secrets are not stored.

Historical matching compares trace text with resolved incident records locally. New submitted traces are persisted as investigating incidents and excluded from historical matching until resolved.

## AI and search behavior

1. The server validates the submitted trace and ranks resolved incidents using local token similarity and service-name overlap.
2. Commit rows are retrieved from Supabase by the matched incident IDs.
3. Local rules create cautious recommendations and an editable post-mortem from the trace and retrieved evidence.
4. The interface identifies these results as rule-based, not AI-generated. Verify facts before using a draft operationally.

## Demo

- The main route redirects to `/analyze`.
- **Load Demo Incident** inserts a connection-pool stack trace matching the seeded “Payment DB Connection Pool Exhaustion” record.
- The analysis result presents the database similarity score, engineer, historical root cause and resolution, and actual linked commit row.
- **Generate Post-Mortem** creates a local structured draft. It is editable before it is saved.
- **Save Post-Mortem** inserts the document into Supabase; `/postmortems` reloads saved records from the database.
- `/incidents` supports filtering, search, record expansion, and persisted status changes.
- `/dashboard` and `/analytics` calculate metrics from Supabase incident records.

## Commands

```bash
npm run dev       # development server
npm run typecheck # TypeScript check
npm run build     # production build
npm run start     # serve a production build
npm run seed      # embed and upsert demo data
```

## Deployment

Deploy the repository as a Next.js project on Vercel. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a randomly generated `DEMO_AUTH_SECRET` in the Vercel project environment settings. Run the SQL migration in the target Supabase project; sample incidents are loaded automatically when the app is visited. Then deploy with `npm run build` / Vercel's standard Next.js build.

The app reports configuration and database errors in the UI/API. Its free demo search and report generation work without live AI, but are rule-based rather than model-generated.

This hackathon build is a single-workspace demo with a publicly displayed shared admin login. Before using it with real data, replace the demo credentials with proper identity/access controls and add durable rate limits.
