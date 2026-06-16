# ADR 0003 — 4-column grid layout and status accent bar for appointment cards

**Date:** 2026-06-15  
**Status:** Accepted

## Context

The appointment card in `frontend/modules/appointments/views/list.html` (lines 225-348) used `flex flex-col md:flex-row md:items-center gap-6` with no fixed column widths. This caused three persistent alignment problems:

- **Ragged column alignment** — the patient `flex-1` block absorbed variable space based on name length, pushing Doctor and Status to different horizontal positions per card. Scanning a list of 10 appointments required re-reading each row because no column ever landed at the same X position.
- **Doctor right-aligned with no anchor width** — `md:items-end` floated the doctor name unpredictably; cards with short patient names produced wildly different doctor column positions from cards with long names.
- **Status badge orphaned on mobile** — the badge appeared between the Doctor and Actions columns with no surrounding context.
- **No per-status identity at a glance** — every card used the same white background, making status only discoverable by reading the badge text. In a busy afternoon schedule, distinguishing CONFIRMED from WAITING from IN_PROGRESS required active reading of 8+ badges per screenful.

## Decision

Replace the flex layout on the card with a **4-column CSS Grid** and add a **status-keyed left accent bar**.

### Grid

```
grid grid-cols-1 md:grid-cols-[1fr_180px_148px_auto] md:items-center gap-4 md:gap-6
```

| Column | Width | Content |
|---|---|---|
| 1 | `1fr` | Patient info (avatar + name + date + type pill + notes) |
| 2 | `180px` | Doctor name |
| 3 | `148px` | Status pill (hidden on mobile) |
| 4 | `auto` | Action buttons |

Fixed pixel widths on columns 2 and 3 guarantee that Doctor and Status land at the same X position on every card regardless of patient name length or notes content.

### Left accent bar

`border-l-4` added to the card's static class list. Status color applied via `ng-class`:

| Status | Color |
|---|---|
| SCHEDULED | `border-l-sky-400` |
| CONFIRMED | `border-l-blue-500` |
| WAITING | `border-l-amber-400` |
| IN_PROGRESS | `border-l-violet-500` |
| COMPLETED | `border-l-emerald-500` |
| NO_SHOW | `border-l-rose-400` |
| RESCHEDULED | `border-l-slate-300` |
| CANCELED | `border-l-red-400` |

The accent bar uses the same color family as each status's existing pill badge, creating a redundant visual cue: users can scan the left edge of the list to identify status groups without reading any text. `border border-slate-200` continues to govern the other three sides; `border-l-4` + status color overrides only the left side.

### Cell 1 — Patient Info changes

- Removed `flex-1` from the outer cell div (grid `1fr` track handles expansion).
- Added `min-w-0 flex-1` to the inner text div — required for `truncate` to function in a flex child.
- Patient name row wrapped in `flex items-center gap-2 mb-1` to accommodate a mobile-only inline status badge.
- `truncate` added to the `<h3>` — prevents long names from bleeding into the Doctor column on narrow-ish md breakpoints.
- Appointment type converted from a plain `<p>` to an inline pill (`bg-primary/8 rounded-full`) — consistent with the visual language of other badges in the UI.
- `line-clamp-1` added to the notes `<p>` — prevents notes from causing card height variation across rows.

### Cell 2 — Doctor changes

Removed `md:items-end`. Doctor name is now left-aligned on both breakpoints. The fixed 180px grid column makes this stable; right-alignment with no anchor width was the root cause of the ragged appearance.

### Cell 3 — Status (Desktop Only)

- `hidden md:flex` — the status pill is hidden on mobile; status is communicated there by the accent bar and the inline badge in Cell 1.
- Icon added inside the pill — same `getStatusConfig(appt.status).icon` already used in Cell 1's date row. The icon disambiguates similar-length status labels (`WAITING` / `CONFIRMED`) faster than text alone.

### Cell 4 — Actions

Unchanged. All `ng-if` conditions, `hc-has-role` directives, `ng-click` handlers, `ui-sref` routing, `title` tooltips, and button classes from ADR 0002 are preserved verbatim. The `border-t md:border-t-0 md:border-l` separator continues to function correctly in the grid context.

Zero changes to `appointments.controller.js`.

## Consequences

**Positive:**
- Doctor names and status pills are vertically aligned across all cards — the list now reads as a structured table rather than a stack of independent cards.
- The left accent bar communicates status at a glance before any text is read, reducing cognitive load during busy reception workflows.
- Long patient names truncate cleanly instead of pushing adjacent columns out of position.
- Notes clamped to one line prevents height inconsistency between cards.
- The type pill badge is visually consistent with other badge components in the system.

**Negative / Trade-offs:**
- Fixed pixel widths on columns 2 and 3 mean very long doctor names (>~22 chars) will truncate on desktop. The 180px column was sized for typical Brazilian medical names; edge cases exist.
- The `border-l-4` accent adds 4px to the card's left edge. Cards that previously appeared fully symmetric now have a left-heavy weight — intentional, not accidental.

## Alternatives considered

- **Explicit `min-width` / `max-width` on flex children:** rejected — flex percentage math produces rounding errors at mid breakpoints and makes responsive debugging harder than named grid tracks.
- **Background color tint per status:** rejected — a full background tint interferes with the `opacity-55 grayscale-[0.4]` terminal-status treatment, which must desaturate the entire card uniformly.
- **Icon-only status on the card edge (no pill on desktop):** rejected — the pill remains necessary for users who cannot distinguish the accent bar colors (color-blind contexts). Two redundant cues are better than one.
