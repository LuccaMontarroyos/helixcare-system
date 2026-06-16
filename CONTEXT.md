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

**Action button hierarchy (Tier 1 / 2 / 3)**  
The three visual levels used in the appointments list action strip. Tier 1 = primary CTA for each status (solid fill, shadow); Tier 2 = secondary or bypass actions (outlined, muted); Tier 3 = utility and destructive controls separated by a vertical divider (ghost, icon-only where possible). See ADR 0002.

**Primary CTA**  
The single Tier-1 button displayed per appointment row — the action the system expects the current role to take next given the appointment's status. Examples: "Confirmar" (SCHEDULED), "Chegou" (CONFIRMED), "Iniciar Consulta" (WAITING).

**Utility strip**  
The Tier-3 section of the appointment action strip, rendered to the right of a vertical divider. Contains low-frequency and destructive actions (Cancelar, Remarcar, Editar, Remover) with minimal visual presence until hovered.

**`IN_PROGRESS` status pill**  
A non-interactive animated element shown in the action strip when `appt.status === 'IN_PROGRESS'`. Displays a pulsing violet dot and the label "Em andamento". Replaces all action buttons — no workflow action is available while a session is live.

**Appointment card grid (4-column)**  
The layout used in the appointments list (`views/list.html`) for each appointment row. A CSS Grid with tracks `[1fr_180px_148px_auto]` on `md+` breakpoints. Column 1: patient info; Column 2 (180px fixed): doctor name; Column 3 (148px fixed): status pill, hidden on mobile; Column 4 (auto): action buttons. Fixed column widths guarantee that Doctor and Status land at the same horizontal position across all cards. See ADR 0003.

**Status accent bar**  
A `border-l-4` left border on each appointment card whose color is keyed to the appointment's status (e.g. `border-l-sky-400` for SCHEDULED, `border-l-violet-500` for IN_PROGRESS). Provides a redundant visual cue — status is readable from the left edge of the list without reading badge text. Applied via `ng-class` alongside `border border-slate-200` which governs the other three sides. See ADR 0003.

**Mobile-only status badge**  
An inline status pill rendered next to the patient name on viewports below `md`. Appears because Column 3 (the desktop status pill) is `hidden md:flex`. On mobile, status identity is carried by the accent bar plus this inline badge.
