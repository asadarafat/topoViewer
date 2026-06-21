## Design

### Audit Findings

The audit used the running browser harness at desktop, narrow desktop, and
stacked responsive widths.

Observed issues:

- At default desktop width, the Inspect panel style rows are visually crowded.
  Long style labels, provenance chips, Reset, and Remove cannot reliably share a
  single row.
- At default desktop width, not all mode tabs are visible; `Layers` can be
  hidden behind the tab scroll affordance even though it is a primary mode.
- At stacked responsive width, the active rail panel can collapse so the user
  sees the mode tabs and then the canvas, but not the selected mode content.
- Attention controls are visually acceptable, but fieldset/legend sizing should
  be tested so labels do not clip at the minimum rail width.
- Monaco content produces horizontal overflow internally by design. Layout tests
  should ignore Monaco's internal scroll containers while still checking that
  the surrounding panel does not overflow.

### Inspect Row Layout

Inspect should use a layout that prioritizes scanability over fitting every
control into one line.

Recommended structure:

- Labels/Data rows:
  - key and value controls share the first row;
  - row actions sit in a compact second row or trailing action area;
  - controls may wrap at narrow widths.
- Style rows:
  - style key and value controls are the primary row;
  - provenance chip and Reset/Remove actions are a secondary row;
  - secondary actions align consistently across rows;
  - long values should truncate inside controls, not push the row wider.

This keeps dense Inspect controls readable without making the panel feel like a
table squeezed into a sidebar.

### Mode Tabs

At the default one-third rail width, the primary mode tabs should be visible
without surprising pagination. The preferred approach is:

- use compact tab sizing and allow horizontal scroll only when the rail is below
  the supported minimum width;
- keep tab labels stable: Build, Inspect, YAML, Attention, Layers;
- avoid scroll arrows at normal desktop width when all labels can fit.

### Responsive Stacked Layout

When the workspace stacks vertically:

- the rail must include the active mode panel content before the canvas;
- the active panel should receive a stable minimum height appropriate to the
  mode;
- the canvas should start after the panel, not immediately after the mode tabs;
- users should not need to guess that panel content has collapsed to zero
  height.

### Editor And Diagnostics

The YAML editor may scroll horizontally internally. The outer panel should not
overflow.

The copy button should remain pinned to the editor's top-right corner and should
not overlap the first meaningful line of YAML because the editor reserves top
padding.

Diagnostic markers should remain visible on the affected editor line.

### Testing Strategy

Add Playwright checks that:

- no active harness panel content overflows the rail except Monaco's intentional
  editor internals;
- mode tabs expose all primary modes at default desktop rail width;
- stacked viewport shows active panel content before the canvas;
- Inspect style rows do not clip controls at desktop and minimum rail widths;
- Attention field labels do not clip;
- YAML copy button remains in the editor top-right corner;
- invalid YAML still produces Monaco markers and line highlights.
