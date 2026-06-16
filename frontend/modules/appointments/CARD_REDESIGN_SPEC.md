# Appointment Card Layout Redesign — Spec

## Problem

The appointment card (lines 225–348 of `views/list.html`) uses `flex flex-col md:flex-row` with no fixed widths on the inner columns. This causes:

- **Ragged column alignment** — the patient `flex-1` block absorbs variable space, pushing Doctor and Status to different horizontal positions per card
- **Doctor right-aligned** via `md:items-end` with no anchor width → text floats unpredictably
- **Status badge** orphaned on mobile — appears between Doctor and Actions with no visual context
- **No status identity on the card itself** — every card looks identical until the badge is read

---

## Design Baseline (design-taste-frontend-v1)
- DESIGN_VARIANCE: 8
- MOTION_INTENSITY: 6
- VISUAL_DENSITY: 4

Stack constraint: **AngularJS 1.3.7 + Tailwind CSS CDN (JIT)** — pure utility classes only.

---

## 4-Column Grid Layout (Desktop)

Replace `flex flex-col md:flex-row md:items-center gap-6` with:

```
grid grid-cols-1 md:grid-cols-[1fr_180px_148px_auto] md:items-center gap-4 md:gap-6
```

| Column | Width | Content |
|---|---|---|
| 1 | `1fr` | Patient info (avatar + name + date + type + notes) |
| 2 | `180px` | Doctor name |
| 3 | `148px` | Status pill (hidden on mobile) |
| 4 | `auto` | Action buttons |

---

## Status-Keyed Left Accent Bar

Add `border-l-4` to the static card classes. Apply status color via `ng-class`:

| Status | Class |
|---|---|
| SCHEDULED | `border-l-sky-400` |
| CONFIRMED | `border-l-blue-500` |
| WAITING | `border-l-amber-400` |
| IN_PROGRESS | `border-l-violet-500` |
| COMPLETED | `border-l-emerald-500` |
| NO_SHOW | `border-l-rose-400` |
| RESCHEDULED | `border-l-slate-300` |
| CANCELED | `border-l-red-400` |

The `border border-slate-200` governs the other three sides; `border-l-4` + status color overrides only the left side (same mechanism as `border-r-4 border-primary` in the existing sidebar nav).

---

## Cell 1 — Patient Info

```html
<div class="flex items-center gap-4">
  <div class="size-14 rounded-full overflow-hidden ring-2 shrink-0 flex items-center justify-center font-bold text-xl"
      ng-class="appt.status === 'CANCELED' ? 'ring-slate-200 bg-slate-100 text-slate-400' : 'ring-primary/20 bg-primary/10 text-primary'">
    {{ appt.patient.name.charAt(0) | uppercase }}
  </div>
  <div class="min-w-0 flex-1">
    <div class="flex items-center gap-2 mb-1">
      <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-none truncate">
        {{ appt.patient.name }}
      </h3>
      <!-- Mobile-only status badge (Cell 3 is hidden on mobile) -->
      <span class="md:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0"
          ng-class="getStatusConfig(appt.status).class">
        {{ getStatusConfig(appt.status).text }}
      </span>
    </div>

    <p class="text-slate-500 text-sm flex items-center gap-1 font-medium">
      <span class="material-symbols-outlined text-[16px]">{{ getStatusConfig(appt.status).icon }}</span>
      {{ appt.appointment_date | date:'dd/MM/yyyy HH:mm' }}
      <span ng-if="appt.duration_minutes" class="text-slate-400 text-xs">
        &bull; {{ formatDuration(appt.duration_minutes) }}
      </span>
    </p>

    <!-- Type: converted from <p> to pill badge -->
    <span ng-if="appt.appointment_type && appt.appointment_type !== 'OUTRO'"
        class="inline-flex items-center gap-1 bg-primary/8 text-primary text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1">
      <span class="material-symbols-outlined text-[13px]">medical_services</span>
      {{ getTypeLabel(appt.appointment_type) }}
    </span>

    <!-- Notes: line-clamp prevents card height variation -->
    <p class="text-xs text-slate-400 mt-1 italic line-clamp-1" ng-if="appt.notes">
      {{ appt.notes }}
    </p>
  </div>
</div>
```

**Key changes vs current:**
- Remove `flex-1` from outer div (grid `1fr` track handles expansion)
- Add `min-w-0 flex-1` to inner text div — required for `truncate` to work in a flex container
- Name row wrapped in `flex items-center gap-2 mb-1` to accommodate mobile badge
- `truncate` on `<h3>` prevents overflow into Doctor column
- Type `<p>` → `<span>` pill with `bg-primary/8 rounded-full`
- `line-clamp-1` on notes

---

## Cell 2 — Doctor

```html
<div class="flex flex-col gap-1">
  <span class="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Médico</span>
  <span class="text-slate-700 dark:text-slate-200 font-semibold leading-none">{{ appt.doctor.name || 'N/A' }}</span>
</div>
```

**Key change:** Remove `md:items-end`. Left-align on both breakpoints — the fixed 180px grid column makes this stable and readable.

---

## Cell 3 — Status (Desktop Only)

```html
<div class="hidden md:flex items-center">
  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
      ng-class="getStatusConfig(appt.status).class">
    <span class="material-symbols-outlined text-[14px]">{{ getStatusConfig(appt.status).icon }}</span>
    {{ getStatusConfig(appt.status).text }}
  </span>
</div>
```

**Key changes:**
- `hidden md:flex` — hidden on mobile; status is carried by the accent bar + inline badge in Cell 1
- Icon added inside the pill — `schedule` vs `chair` vs `check_circle` disambiguates similar-length statuses faster

---

## Cell 4 — Actions

**UNCHANGED.** All `ng-if`, `ng-click`, `hc-has-role`, `ui-sref`, and button classes from the button redesign are preserved verbatim. The `border-t md:border-t-0 md:border-l` separator still works correctly in the grid context.

---

## What Is NOT Changing
- All `ng-if` conditions
- All `hc-has-role` directives
- All `ng-click` handlers
- All `ui-sref` navigation
- All `title` tooltip attributes
- The entire button hierarchy from the button redesign spec
- Everything outside lines 225–348 (header, filters, loading state, empty state, pagination, modal)
- `appointments.controller.js` — zero controller changes

---

## Verification Checklist
- [ ] Desktop (≥ md): all cards have 4 aligned columns — Patient | Doctor | Status | Actions
- [ ] Doctor names and status pills are at the same horizontal position across all cards
- [ ] Left accent bar color matches appointment status on every card
- [ ] Terminal statuses (COMPLETED, NO_SHOW, RESCHEDULED, CANCELED) still show `opacity-55 grayscale-[0.4]`
- [ ] Mobile (< md): status badge appears inline next to patient name
- [ ] Mobile: Doctor and Actions stack vertically with correct border-t separator
- [ ] Type badge renders as a rounded pill, not a plain text row
- [ ] Long patient names truncate instead of overflowing
- [ ] Long notes are clamped to 1 line
- [ ] All action buttons still fire correctly (Confirmar, Chegou, Iniciar Consulta, Cancelar, etc.)
