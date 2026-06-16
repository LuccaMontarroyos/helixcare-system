# SPEC: Auto-charge appointments on *completion* (service provided)

## Context

The request was framed as "make billing automatic instead of the manual modal." Exploration
revealed the premise is only half true: **automatic charging already exists** and is the
documented standard (`backend/CLAUDE.md`, `backend/src/modules/billing/CLAUDE.md` — invoices are
created via domain events; other modules must never call `BillingService` directly).

The real problem is **when** the auto-charge fires. Today it fires on patient **arrival**:
`appointments.service.ts` emits `appointment.arrived` on the `→ WAITING` transition, and
`BillingEventListenerService` creates the invoice. That charges *before the service is delivered*
— a patient who checks in (WAITING) but is canceled before being seen still gets billed.

The need — "automatic charge **based on the service provided**" — means the charge must reflect
what was actually done, i.e. fire at **`COMPLETED`**. The manual modal (`POST /invoices`,
currently ADMIN + RECEPTIONIST) is retained but demoted to an **ADMIN-only exception path**
(catalog gaps, ad-hoc charges, corrections); automatic-on-completion becomes the source of truth.

### Decisions locked in (from grilling)
1. **Trigger:** fire on `COMPLETED` (emit `appointment.completed`); retire the arrival-based charge.
2. **Service source:** the appointment's `appointment_type` at completion → `PriceCatalog.resolve`. Make the type correctable before completion.
3. **Manual modal:** keep, but ADMIN-only. RECEPTIONIST loses manual create.
4. **Duplicate guard:** one invoice per appointment — auto-create skips (and logs) if a non-canceled invoice already exists for that `appointment_id`.
5. **Billing rule:** every completed appointment charges by type (no free-return logic in v1; exceptions handled by ADMIN canceling the invoice or a catalog price of 0).
6. **Exams:** unchanged — they already charge on the real `exam.completed` event.
7. **Docs:** deliver this `SPEC.md` + an ADR + a root `CONTEXT.md` glossary.

## Deliverables

### A. Documentation
- **`SPEC.md`** (this file) — the feature spec.
- **`docs/adr/0001-charge-appointments-on-completion.md`** — records why the charge moved from arrival (`WAITING`) to completion (`COMPLETED`): hard to reverse, surprising without context, a real trade-off (don't bill patients who arrive but aren't seen vs. losing the early-billing behavior).
- **`CONTEXT.md`** (repo root — single bounded context, no `CONTEXT-MAP.md` needed) — glossary only: *Invoice/Fatura*, *Charge*, *Service provided* (the delivered `appointment_type`), *Arrival* (WAITING) vs *Completion* (COMPLETED), *Manual override*. No implementation detail.

### B. Backend code changes

**1. New domain event — `backend/src/modules/billing/domain-events/appointment-completed.event.ts`**
Mirror `appointment-arrived.event.ts`: `AppointmentCompletedEvent(appointmentId, patientId, doctorId, appointmentType, appointmentDate)`.

**2. Emit on completion — `backend/src/modules/appointments/services/appointments.service.ts` (`update()`, ~lines 200-251)**
- Add `isTransitioningToCompleted = dto.status === COMPLETED && appointment.status !== COMPLETED` (the validator only allows `IN_PROGRESS → COMPLETED`, so this fires exactly once, after `transaction.commit()`, mirroring the existing arrival emit).
- Emit `appointment.completed` with `AppointmentCompletedEvent`.
- **Remove** the `appointment.arrived` emit + `isTransitioningToWaiting` block.

**3. Listener — `backend/src/modules/billing/services/billing-event-listener.event.ts`**
- Replace `@OnEvent('appointment.arrived')` `handleAppointmentArrived` with `@OnEvent('appointment.completed')` `handleAppointmentCompleted` (same price-resolution + insurance logic already present).
- Add the **duplicate guard** before `billingService.create(...)`: skip + log if an active invoice already exists for `appointmentId` (see #5).
- Base `due_date` on completion time (`new Date()`) + catalog `dueDays`, end-of-day — consistent with the exam handler — instead of `appointmentDate` (which is now in the past).
- Delete `appointment-arrived.event.ts` and its imports once unused. **Verify nothing else listens** to `appointment.arrived` first (`grep -r "appointment.arrived" backend/src`; exploration found only billing).

**4. Duplicate guard — `backend/src/modules/billing/services/billing.service.ts`**
Add `hasActiveInvoiceForAppointment(appointmentId): Promise<boolean>` = exists an invoice with that `appointment_id` and `status != CANCELED` (paranoid scope already excludes soft-deleted). Called by the listener. Manual ADMIN create is intentional and not blocked by this.

**5. Restrict manual create — `backend/src/modules/billing/controllers/billing.controller.ts`**
`POST /invoices`: change `@Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)` → `@Roles(RoleEnum.ADMIN)`.

**6. Make the service correctable — `backend/src/modules/appointments/schemas/update-appointment.schema.ts`**
Add `appointment_type` (`yup.string().oneOf(Object.values(AppointmentTypeEnum)).nullable()`) and `duration_minutes` (`yup.number().positive().nullable()`). The service's `update()` already reads `dto.appointment_type`/`dto.duration_minutes` and recomputes duration + double-booking, but the schema currently strips them — this unblocks correcting the delivered service before completing.

### C. Frontend changes (`frontend/modules/billing/`)
- Hide the "Nova Fatura" button/modal for RECEPTIONIST (ADMIN-only), matching the backend role change. Check how the current view gates by role.
- (Optional, confirm during build) surface that completing an appointment generates the charge automatically, so staff don't also create one manually.

### D. Tests (`*.spec.ts`, alongside source)
- `appointments.service` unit: `IN_PROGRESS → COMPLETED` emits `appointment.completed`; non-completion transitions do not; arrival no longer emits.
- `billing-event-listener` unit: creates one invoice on completion; **skips** when an active invoice already exists; applies insurance discount; uses completion-based due date.
- `billing.service` unit: `hasActiveInvoiceForAppointment` true/false incl. CANCELED excluded.

## Files (reference)
- `backend/src/modules/appointments/services/appointments.service.ts`
- `backend/src/modules/appointments/schemas/update-appointment.schema.ts`
- `backend/src/modules/billing/services/billing-event-listener.event.ts`
- `backend/src/modules/billing/services/billing.service.ts`
- `backend/src/modules/billing/controllers/billing.controller.ts`
- `backend/src/modules/billing/domain-events/appointment-completed.event.ts` (new), delete `appointment-arrived.event.ts`
- Reused as-is: `price-catalog.service.ts`, `PriceCatalog` entity + seed, `Invoice` entity, `appointment-status.validator.ts`.
- No DB migration required (no schema change; the guard is a query).

## Verification
1. `cd backend && npm run build` — compiles, no `any` introduced (per `.claude/rules/typescript.md`).
2. `npm run test` — new unit specs pass.
3. Manual end-to-end (`npm run start:dev`, Swagger `http://localhost:3000/api/docs`):
   - Create appointment → `PUT /appointments/:id` through `CONFIRMED → WAITING → IN_PROGRESS`: **no invoice** created at WAITING.
   - `→ COMPLETED`: exactly **one** invoice created, amount = `PriceCatalog` base price for the `appointment_type` (×0.6 + `BILLED_TO_INSURANCE` if the patient has insurance), due date = today + `dueDays`.
   - Complete a second time / re-run: no duplicate (guard).
   - ADMIN pre-creates a manual invoice, then completes: still one invoice (auto-create skipped, logged).
   - `POST /invoices` as RECEPTIONIST → `403`; as ADMIN → allowed.
   - Confirm via `grep` that `appointment.arrived` has no remaining references.
