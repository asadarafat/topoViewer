## Why

Small and single-node regions can place member nodes close to the default
region label. The current renderer has a hardcoded top-left label offset, while
authors only have broad region padding and `headerPadding` controls. This makes
it awkward to keep labels readable without over-expanding every region.

## What Changes

- Add region `labelPosition` style values for anchoring the label around the
  hull.
- Add region `labelMargin` for a uniform margin from the selected hull edge.
- Keep `headerPadding`, `paddingX`, and `paddingY` as the controls that reserve
  interior room around members.
- Document the default label offset and add a small example focused on
  single-node collision avoidance.

## Non-Goals

- Automatic label collision detection.
- Per-region text measurement.
- Changing the default region hull sizing behavior for existing diagrams.
