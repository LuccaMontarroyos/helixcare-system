# ADR 0002 — 3-tier action button hierarchy for the appointments list

**Date:** 2026-06-15  
**Status:** Accepted

## Context

The action strip in `frontend/modules/appointments/views/list.html` (lines 273–339) rendered every workflow action — primary CTAs, bypass actions, destructive controls, and utility icons — as a visually identical outlined badge. The uniform treatment produced no visual hierarchy: **Confirmar**, **Iniciar Consulta**, and **Cancelar** carried the same visual weight, forcing users to read every label on every row to identify what the next action should be.

The symptoms:
- Receptionists scanned each row rather than acting on the dominant CTA.
- Destructive actions (**Cancelar**, **Remover**) sat at the same prominence as primary workflow actions.
- No affordance distinguished "what you should do now" from "what you can do if needed."

## Decision

Introduce a **3-tier button hierarchy** driven by role and action urgency:

**Tier 1 — Primary CTA (solid fill, shadow, xl radius):**  
One per status. Filled background with white text and a tinted shadow communicates "this is the expected next step." Sizes are deliberately larger than Tier 2/3.  
- `SCHEDULED` → **Confirmar** (sky-500 fill)  
- `CONFIRMED` → **Chegou** (amber-500 fill)  
- `WAITING` → **Iniciar Consulta** (primary fill, `px-5 py-2.5` — the single most important CTA in the workflow)

**Tier 2 — Secondary / Ghost (outlined, muted color):**  
Bypass or infrequent actions that should not compete with Tier 1.  
- `SCHEDULED` → **Receber Paciente** (violet outline — doctor bypass, skips CONFIRMED)  
- `CONFIRMED` → **Faltou** (rose outline — marks absence)

**Tier 3 — Utility strip (right of a vertical divider):**  
Separated by a 1px `bg-slate-200` vertical line. Rendered with near-invisible presence until hovered. Ghost text only; background and border appear on hover.  
- **Cancelar** — ghost red text, border only on hover  
- **Remarcar**, **Editar**, **Remover** — icon-only, slate-400 base, colored on hover

**`IN_PROGRESS` status pill:** Replaces the flat inline text with an animated violet rounded pill (`bg-violet-50`, `border-violet-200`, pulsing dot) — signals an active session without surfacing any action button.

**Motion:** All buttons use `transition-all duration-150` with `active:scale-[0.97]` (Tier 1/2) or `active:scale-[0.90]` (Tier 3 icon buttons) for tactile press feedback.

All `ng-if` conditions, `hc-has-role` directives, `ng-click` handlers, `ui-sref` routing, and icon names are unchanged.

## Consequences

**Positive:**
- Users immediately identify the next action per row without reading every label.
- Destructive actions (**Cancelar**, **Remover**) are visually de-emphasized behind the divider.
- The `IN_PROGRESS` pill communicates live state without competing with the workflow.
- Tactile scale feedback confirms click registration — important in a fast-paced reception context.

**Negative / Trade-offs:**
- Tier 1 buttons (solid fill) are visually heavier than the previous minimal style; this is intentional but may feel jarring to users accustomed to the flat design.
- The vertical divider adds one extra DOM element per appointment row; negligible cost at typical list lengths.

## Alternatives considered

- **Color-coding only, same shape:** rejected — shape and fill weight communicate hierarchy more reliably than hue alone across accessibility contexts.
- **Single-action dropdown per row:** rejected — adds a click to every workflow action and hides available options, slowing down high-frequency reception workflows.
