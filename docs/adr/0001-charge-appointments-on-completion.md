# ADR 0001 — Charge appointments on completion, not on arrival

**Date:** 2026-06-15  
**Status:** Accepted

## Context

The billing module originally created an invoice when a patient transitioned to **WAITING** (arrival at the clinic). The trigger was the `appointment.arrived` domain event emitted in `AppointmentsService.update()` on the `→ WAITING` transition.

This meant a patient who checked in but was later canceled (e.g., doctor unavailable, patient left before being seen) would still be billed — before any service was delivered.

The stated requirement is: *"automatic charge based on the service provided."*

## Decision

Move the auto-billing trigger from **WAITING (arrival)** to **COMPLETED (service delivered)**:

- `AppointmentsService.update()` now emits `appointment.completed` on the `IN_PROGRESS → COMPLETED` transition (which the status validator already enforces as the only valid path to COMPLETED).
- `BillingEventListenerService` listens to `appointment.completed` and creates the invoice using the appointment's `appointment_type` at completion time.
- A **duplicate guard** (`BillingService.hasActiveInvoiceForAppointment`) prevents double-billing if the event fires more than once or a manual invoice was pre-created by ADMIN.
- The due date is calculated from **completion time** (`new Date()`) + catalog `dueDays`, not from `appointment_date` (which is in the past at completion).
- Manual invoice creation (`POST /invoices`) is retained as an ADMIN-only exception path for catalog gaps, ad-hoc charges, and corrections. RECEPTIONIST loses this permission.
- The `appointment.arrived` event and `AppointmentArrivedEvent` class are deleted; nothing else consumed them.

## Consequences

**Positive:**
- Patients who arrive but are not seen (canceled before `IN_PROGRESS`) are never billed.
- The charge reflects the service actually delivered, not the patient's physical presence.
- Billing is consistent: every completed appointment produces exactly one invoice.

**Negative / Trade-offs:**
- Clinics that relied on early billing (charging on arrival) lose that behavior. The workaround is ADMIN manually creating an invoice or setting a catalog price of 0 for free returns.
- The window between patient arrival and service completion is now unbilled; if the system crashes mid-session the invoice will not be created automatically (requires ADMIN manual create or a retry mechanism, not in scope for v1).

## Alternatives considered

- **Keep arrival-based billing, add a refund on cancel:** rejected — it creates negative-balance invoices and adds complexity to the cancellation flow.
- **Charge on `IN_PROGRESS` (start of service):** closer to "service provided" but still before completion; discarded for the same reason as arrival-based billing.
