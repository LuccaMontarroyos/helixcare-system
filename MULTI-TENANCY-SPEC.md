# Multi-Tenancy Spec — HelixCare

**Status:** Approved design, pending implementation plan
**Date:** 2026-06-16
**Scope:** Adapt the single-tenant HelixCare system so multiple clinics share one deployment while being fully isolated — no clinic can ever see another clinic's data.

---

## 1. Goal & non-goals

**Goal:** Introduce the concept of a *clinic* (tenant) and guarantee that all business data is isolated per clinic, enforced automatically so a developer cannot accidentally leak data across clinics.

**Non-goals (YAGNI for now):**
- One user belonging to multiple clinics (each user belongs to exactly one clinic).
- Per-clinic schemas or per-clinic databases (we use a shared schema with a discriminator column).
- Self-service clinic signup / billing of clinics themselves.
- Rich clinic profile data (CNPJ, address, branding) beyond name + active flag.

---

## 2. Foundational decisions (locked)

| Decision | Choice |
|---|---|
| Isolation model | Shared database, shared schema, `clinic_id` discriminator column |
| User ↔ clinic | Each user belongs to **exactly one** clinic; `clinic_id` baked into the JWT at login |
| Enforcement | **Automatic** via `AsyncLocalStorage` request context + global Sequelize hooks (default-deny) |
| Provisioning | New platform-level `SUPER_ADMIN` role, above clinics, provisions clinics + their first admin |
| Existing data | Pre-production: migration backfills all existing rows into one seed "default" clinic |

---

## 3. Data model

### 3.1 New `clinics` table (`Clinic` entity)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `defaultValue: UUIDV4` |
| `name` | STRING(150) NOT NULL | |
| `is_active` | BOOLEAN NOT NULL default `true` | Inactive clinics block their users' login |
| `created_at` / `updated_at` / `deleted_at` | timestamps | `paranoid: true`, `underscored: true` |

The `clinics` table itself has **no** `clinic_id`.

### 3.2 Add `clinic_id` to tenant-scoped tables

`clinic_id` (UUID, FK → `clinics.id`, **NOT NULL**) is added to every tenant-scoped table, each with an **index on `clinic_id`**:

- `patients`
- `users`
- `appointments`
- `medical_records` (and the medical-record history table)
- `exams`
- `invoices`
- `price_catalog`

> If any additional business table exists at implementation time (verify against the full entity list), it is treated as tenant-scoped unless it is global reference data. The authoritative registry of scoped models lives in code (see §5.1).

### 3.3 Global (non-scoped) tables

- `roles` — fixed reference data (`ADMIN`, `RECEPTIONIST`, `DOCTOR`, `NURSE`, `LAB_TECHNICIAN`, `SUPER_ADMIN`). No `clinic_id`.
- `clinics` — the tenant table itself.

### 3.4 Unique constraints

- **`patients.cpf`**: drop the existing global `unique` constraint; replace with a **composite unique `(clinic_id, cpf)`**. The same person can legitimately be a patient at two clinics.
- **`users.email`**: **remains globally unique.** Login is email + password with no clinic hint, so an email must resolve to exactly one user (and therefore one clinic). This is intentional and must not be relaxed without redesigning the login flow.

---

## 4. Tenant context (per request)

### 4.1 `TenantContextService`

Backed by Node `AsyncLocalStorage`, holding:

```ts
interface TenantContext {
  clinicId: string | null;   // null for SUPER_ADMIN / system paths
  isSuperAdmin: boolean;
}
```

Exposes `run(context, callback)`, `getClinicId()`, `isSuperAdmin()`, and a way to detect "no context" (system path).

### 4.2 Propagation

1. `clinic_id` is added to the **JWT payload** at login (alongside `sub` and `role`).
2. `JwtStrategy.validate` returns `{ id, role, clinicId }`; `ICurrentUser` gains `clinicId`.
3. A **global interceptor** runs after `JwtAuthGuard` (so `req.user` is populated), reads `req.user`, and wraps the rest of the request in `tenantContext.run({ clinicId, isSuperAdmin }, () => next.handle())`.

For `SUPER_ADMIN`, `clinicId` is `null` and `isSuperAdmin` is `true`.

---

## 5. Automatic enforcement (Sequelize hooks)

### 5.1 Scoped-model registry

A single source of truth in code listing which models are tenant-scoped (e.g. an exported `TENANT_SCOPED_MODELS` set, or a marker on the model). Hooks consult this registry so global tables (`roles`, `clinics`) are never filtered.

### 5.2 Hooks

Registered globally against the scoped models:

- `beforeFind` → if there is a tenant context with a `clinicId` and the model is scoped, inject `where.clinic_id = clinicId`. Covers `findAll`, `findOne`, and **`findByPk`**.
- `beforeCreate` / `beforeBulkCreate` → stamp `clinic_id` from context when not already set.
- `beforeBulkUpdate` / `beforeBulkDestroy` → inject `clinic_id` into the `where`.

### 5.3 Behavior matrix

| Caller | Behavior |
|---|---|
| Authenticated clinic user | All scoped queries auto-filtered to their `clinicId`. Cannot be forgotten. |
| Cross-clinic access (e.g. `findByPk` of another clinic's row) | Returns `null` → **404 Not Found** (not 403 — avoids leaking row existence). |
| `SUPER_ADMIN` (`isSuperAdmin = true`) | Hook injection bypassed. Kept off clinical endpoints by `RolesGuard`. |
| No context (cron / webhook / pre-auth login lookup) | No auto-filter; trusted system code handles clinic explicitly (see §6). |

Default-deny applies to every authenticated request path: the only way to query across clinics is to be `SUPER_ADMIN` or to run as trusted system code that explicitly opts out.

---

## 6. Tenant-blind edges (explicit handling)

- **Billing webhooks** (unauthenticated, no JWT): resolve the referenced invoice by id (unscoped lookup), derive its `clinic_id`, and operate with that clinic.
- **No-show cron**: runs unscoped across all clinics; appointment rows already carry `clinic_id`. When it triggers invoices/domain events, it passes the source appointment's `clinic_id`.
- **Domain events** (`appointment.arrived`, `exam.completed` → auto invoices): event payloads carry `clinic_id` so listeners create the invoice in the correct clinic.
- **Global search** (`search.service.ts`) and **analytics** (`analytics.service.ts`): run in request context, so hooks cover model-based queries automatically. Audit both for raw SQL; any raw query gets a manual `clinic_id` filter.

---

## 7. Provisioning & roles

- Add **`SUPER_ADMIN`** to `RolesEnum` and the roles seeder. Platform-level, not clinic-scoped.
- New **`ClinicsModule`** with a `SUPER_ADMIN`-only controller:
  - Create clinic (also creates the clinic's first `ADMIN` user in a single transaction).
  - List clinics.
  - Deactivate clinic (`is_active = false`).
- Existing `ADMIN` becomes **clinic-scoped** — manages only its own clinic. Staff registration stamps `clinic_id` from the creating admin's context.
- **Login** rejects users whose clinic `is_active = false`.

---

## 8. Migration plan (pre-production backfill)

All schema changes require Sequelize migrations in `backend/src/database/migrations/` (`YYYYMMDDHHMMSS-descricao-kebab-case.js`).

1. **Create `clinics`** table; seed one **default clinic** with a fixed UUID.
2. For each scoped table: add `clinic_id` **nullable** → backfill all existing rows to the default clinic id → `ALTER ... SET NOT NULL` + add FK to `clinics.id` + add index on `clinic_id`.
3. **`patients.cpf`**: drop the global unique constraint; add composite unique `(clinic_id, cpf)`.
4. Seed the **`SUPER_ADMIN`** role and a SUPER_ADMIN user.

Rollback: each migration provides a `down` that reverses its change (drop column/constraint/index, restore the global `cpf` unique). Per project rule, no production migration rollback without explicit approval — not a concern here since this is pre-production.

---

## 9. Testing

### Unit
- Hook injection logic: scoped vs unscoped models, `SUPER_ADMIN` bypass, missing-context (system) path, create-stamping.
- `TenantContextService` (`run` / `getClinicId` / `isSuperAdmin`).

### E2E isolation (the core guarantee)
Two clinics A and B, seeded with data:
- Clinic A cannot **list** clinic B's patients (only its own returned).
- Clinic A cannot **read** clinic B's patient by guessed UUID (`findByPk` → 404).
- Clinic A cannot **update** or **delete** clinic B's rows (→ 404).
- Repeat the read/update/delete checks across the other scoped resources (appointments, exams, invoices, medical records).
- **Per-clinic CPF uniqueness**: same CPF can be created in clinic A and clinic B; duplicate within the same clinic is rejected.
- **JWT** carries `clinic_id`; a tampered/foreign `clinic_id` cannot widen access (enforcement comes from the validated token, not client input).
- **Webhook** attributes the resulting invoice to the correct clinic.
- `SUPER_ADMIN` can manage clinics but is denied clinical endpoints.

---

## 10. Affected areas (implementation checklist seed)

- `core/` — new `TenantContextService`, tenant interceptor, Sequelize hooks registration, scoped-model registry.
- `modules/auth/` — JWT payload + `JwtStrategy`, `ICurrentUser`, login active-clinic check, register stamping.
- `modules/clinics/` — **new** module (entity, controller, service, schema/DTO).
- `modules/roles/` — `SUPER_ADMIN` enum + seeder.
- All scoped entities — add `clinic_id` column + association.
- `modules/billing/` — webhook clinic resolution; domain-event `clinic_id` payloads.
- `modules/appointments/` — no-show cron clinic propagation.
- `search/`, `modules/analytics/` — audit raw SQL for manual `clinic_id` filtering.
- `database/migrations/` + `database/seeders/` — schema changes, default clinic, SUPER_ADMIN.
- Tests — unit (hooks, context) + e2e (isolation).
