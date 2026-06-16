# Helixcare — Bounded Context Glossary

This file defines the canonical terms used in the Helixcare codebase. When a term appears in code, docs, or ADRs, it carries the meaning defined here.

## Terms

**Invoice / Fatura**  
A financial record that represents an amount owed by a patient for a service rendered. Created automatically by the billing event listener or manually by an ADMIN. An invoice is linked to either an `Appointment` or an `Exam`, never both.

**Charge**  
The act of creating an Invoice. Automatic charges are triggered by domain events; manual charges are created via `POST /invoices` (ADMIN only).

**Service provided**  
The medical or procedural service actually delivered to the patient, identified by the appointment's `appointment_type` at the moment the appointment reaches **COMPLETED** status. This is the source of truth for what to bill.

**Arrival**  
The moment a patient physically checks in at the clinic, represented by the appointment transitioning to **WAITING** status. Arrival does **not** trigger billing; it only signals that the patient is present.

**Completion**  
The moment a service is fully delivered, represented by the appointment transitioning to **COMPLETED** status (from `IN_PROGRESS`). Completion is the billing trigger for appointments.

**Manual override**  
An invoice created directly via `POST /invoices` by an ADMIN, bypassing the automatic event-driven path. Used for catalog gaps, ad-hoc charges, and corrections. Protected by the duplicate guard — auto-billing skips if a non-canceled invoice already exists for the same appointment.

**PriceCatalog / Catálogo de Preços**  
The table that maps service types (`APPOINTMENT` or `EXAM` + sub-type) to base price, payment method, and due-date offset (`dueDays`). Managed by `PriceCatalogService.resolve()`.

**Duplicate guard**  
A safety check in `BillingService.hasActiveInvoiceForAppointment()` that returns `true` if a non-canceled invoice already exists for a given `appointment_id`. The listener skips auto-create when this returns `true`, logging the skip instead of throwing.
