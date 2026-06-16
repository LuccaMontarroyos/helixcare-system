# Appointment Action Button Redesign — Spec

## Problem
The action button strip in `views/list.html:273–339` has no visual hierarchy. Every status-action button is a uniform light-tinted outlined badge with the same padding, same font weight, same border color. Confirmar, Iniciar Consulta, and Cancelar all look identical in weight — there is no CTA, no primary action, no destructive de-emphasis.

---

## Design Baseline (design-taste-frontend-v1)
- DESIGN_VARIANCE: 8 — asymmetric layout, offset grouping
- MOTION_INTENSITY: 6 — fluid CSS transitions, tactile scale feedback
- VISUAL_DENSITY: 4 — daily app mode, normal spacing

Stack constraint: **AngularJS 1.3.7 + Tailwind CSS** — no React, no Framer Motion. All visual improvements are pure Tailwind utility classes.

---

## 3-Tier Button Hierarchy

### Tier 1 — Primary CTA (solid fill, shadow, dominant weight)

These are the "what to do next" actions for each status. Largest, boldest, most visually prominent.

| Button | Status | New Tailwind Classes |
|---|---|---|
| **Confirmar** | SCHEDULED | `bg-sky-500 text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm shadow-sky-300/40 hover:bg-sky-600 active:scale-[0.97] transition-all duration-150` |
| **Chegou** | CONFIRMED | `bg-amber-500 text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm shadow-amber-300/40 hover:bg-amber-600 active:scale-[0.97] transition-all duration-150` |
| **Iniciar Consulta** | WAITING | `bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-md shadow-primary/25 hover:brightness-110 active:scale-[0.95] transition-all duration-150` |

> "Iniciar Consulta" gets `px-5 py-2.5` (slightly larger) — it is the single most important CTA in the entire appointments workflow.

---

### Tier 2 — Secondary / Ghost (outlined, lower visual prominence)

Infrequent or bypass actions that should not compete with the Tier 1 CTA.

| Button | Status | New Tailwind Classes |
|---|---|---|
| **Receber Paciente** | SCHEDULED (doctor bypass) | `border border-violet-300 text-violet-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-violet-50 active:scale-[0.97] transition-all duration-150` |
| **Faltou** | CONFIRMED | `border border-rose-200 text-rose-500 rounded-lg px-3 py-2 text-sm font-bold hover:bg-rose-50 active:scale-[0.97] transition-all duration-150` |

---

### Tier 3 — Utility Strip (right of a vertical divider, de-emphasized)

Utility and destructive actions are visually separated by a thin vertical line and rendered with minimal presence.

**Divider:**
```html
<div class="w-px h-7 bg-slate-200 dark:bg-slate-700 shrink-0 mx-1"
     ng-if="canCancelAppointment(appt.status) || appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED'">
</div>
```

| Button | New Tailwind Classes |
|---|---|
| **Cancelar** | `flex items-center gap-1 border border-transparent text-red-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 px-2.5 py-2 rounded-lg text-xs font-bold active:scale-[0.97] transition-all duration-150` |
| **Remarcar** (icon) | `p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg active:scale-[0.90] transition-all duration-150` |
| **Editar** (icon) | `p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg active:scale-[0.90] transition-all duration-150` |
| **Remover** (icon) | `p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-[0.90] transition-all duration-150` |

---

## "Em andamento" Status Pill (replaces flat text span)

```html
<div class="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-full border border-violet-200">
  <span class="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0"></span>
  <span class="text-violet-600 text-xs font-bold">Em andamento</span>
</div>
```

---

## New Container Structure (lines 273–339)

```html
<div class="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-4 md:pt-0 md:pl-6">

  <!-- TIER 1 & 2: Workflow CTAs -->
  <button ng-if="appt.status === 'SCHEDULED'" hc-has-role="['RECEPTIONIST', 'ADMIN']"
    ng-click="confirmAppointment(appt)"
    class="flex items-center gap-1.5 bg-sky-500 text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm shadow-sky-300/40 hover:bg-sky-600 active:scale-[0.97] transition-all duration-150">
    <span class="material-symbols-outlined text-sm">check_circle</span> Confirmar
  </button>

  <button ng-if="appt.status === 'SCHEDULED'" hc-has-role="['DOCTOR', 'ADMIN']"
    ng-click="receivePatientDirect(appt)"
    class="flex items-center gap-1.5 border border-violet-300 text-violet-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-violet-50 active:scale-[0.97] transition-all duration-150"
    title="Paciente chegou sem confirmação prévia">
    <span class="material-symbols-outlined text-sm">login</span> Receber Paciente
  </button>

  <ng-container ng-if="appt.status === 'CONFIRMED'">
    <button hc-has-role="['RECEPTIONIST', 'ADMIN']" ng-click="markAsWaiting(appt)"
      class="flex items-center gap-1.5 bg-amber-500 text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm shadow-amber-300/40 hover:bg-amber-600 active:scale-[0.97] transition-all duration-150">
      <span class="material-symbols-outlined text-sm">chair</span> Chegou
    </button>
    <button hc-has-role="['RECEPTIONIST', 'ADMIN']" ng-click="markAsNoShow(appt)"
      class="flex items-center gap-1.5 border border-rose-200 text-rose-500 rounded-lg px-3 py-2 text-sm font-bold hover:bg-rose-50 active:scale-[0.97] transition-all duration-150">
      <span class="material-symbols-outlined text-sm">person_off</span> Faltou
    </button>
  </ng-container>

  <button ng-if="appt.status === 'WAITING'" hc-has-role="['DOCTOR', 'ADMIN']"
    ui-sref="patient-medical-records({patientId: appt.patient.id, appointmentId: appt.id})"
    class="flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-md shadow-primary/25 hover:brightness-110 active:scale-[0.95] transition-all duration-150">
    <span class="material-symbols-outlined text-sm">play_arrow</span> Iniciar Consulta
  </button>

  <div ng-if="appt.status === 'IN_PROGRESS'"
    class="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-full border border-violet-200">
    <span class="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0"></span>
    <span class="text-violet-600 text-xs font-bold">Em andamento</span>
  </div>

  <!-- DIVIDER -->
  <div class="w-px h-7 bg-slate-200 dark:bg-slate-700 shrink-0 mx-1"
       ng-if="canCancelAppointment(appt.status) || appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED'">
  </div>

  <!-- TIER 3: Utility strip -->
  <button ng-if="canCancelAppointment(appt.status)"
    hc-has-role="['DOCTOR', 'ADMIN', 'RECEPTIONIST']" ng-click="cancelAppointment(appt)"
    class="flex items-center gap-1 border border-transparent text-red-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 px-2.5 py-2 rounded-lg text-xs font-bold active:scale-[0.97] transition-all duration-150"
    title="Cancelar consulta">
    <span class="material-symbols-outlined text-sm">event_busy</span> Cancelar
  </button>

  <button ng-if="appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED'"
    hc-has-role="['ADMIN', 'RECEPTIONIST']" ng-click="openRescheduleModal(appt)"
    class="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg active:scale-[0.90] transition-all duration-150"
    title="Remarcar">
    <span class="material-symbols-outlined">update</span>
  </button>

  <button ng-if="!isTerminalStatus(appt.status) && appt.status !== 'IN_PROGRESS' && appt.status !== 'WAITING'"
    hc-has-role="['ADMIN', 'RECEPTIONIST']" ng-click="openModal(appt)"
    class="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg active:scale-[0.90] transition-all duration-150"
    title="Editar">
    <span class="material-symbols-outlined">edit</span>
  </button>

  <button ng-if="appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED'"
    hc-has-role="['ADMIN', 'RECEPTIONIST']" ng-click="deleteAppointment(appt)"
    class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-[0.90] transition-all duration-150"
    title="Remover">
    <span class="material-symbols-outlined">delete</span>
  </button>

</div>
```

---

## What Is NOT Changing
- All `ng-if` conditions
- All `hc-has-role` directives
- All `ng-click` handlers
- All `ui-sref` navigation
- All `title` tooltip attributes
- All Material Symbols icon names
- Everything outside lines 273–339

---

## Verification Checklist
- [ ] SCHEDULED: "Confirmar" is solid sky blue (filled white text); "Receber Paciente" is quiet outlined violet
- [ ] CONFIRMED: "Chegou" is solid amber (filled white text); "Faltou" is soft outlined rose
- [ ] WAITING: "Iniciar Consulta" is the largest, most prominent button on the row
- [ ] IN_PROGRESS: Animated violet pill, no action buttons
- [ ] Cancelar appears after the divider as a small ghost button (not a filled CTA)
- [ ] Clicking any button produces visible scale-down tactile feedback
- [ ] Utility icons (Remarcar, Editar, Remover) appear to the right of the divider
- [ ] No regressions in ng-click logic, role checks, or routing
