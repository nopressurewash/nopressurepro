# Supabase Foundation (Phase 1)

This project currently persists quotes, clients, invoices, and photos locally (localStorage + IndexedDB). Supabase is being introduced in stages:

- **Phase 1 (this change)**: add the Supabase client helper, environment variables, and a safe multi-tenant schema definition. No existing flows are wired to Supabase yet.
- **Future phases** will migrate stateful hooks (`useLocalData`, photo store, etc.) over to Supabase, using the schema and shared `business_id` ownership pattern defined here.

### Architecture notes

1. **Profiles** map to Supabase Auth users.
2. **Businesses** are workspaces owned by one profile. `businesses.id` is the workspace identifier for all domain data.
3. **Business members** will allow future collaborators (owner/member roles).
4. **Domain tables** (`clients`, `quotes`, `invoices`, `schedule_notes`, `rates`, `quote_photos`) all include `business_id` for strict data isolation.
5. **Photos** store metadata only; binary storage will move to Supabase Storage later.

Existing local persistence remains untouched. When you’re ready, migrate reads/writes to Supabase in later phases while keeping the UI and local flows working until the cutover.
