## Design

Region label placement is a presentation concern, so the public controls live
on region styles:

- `labelPosition`: edge/corner anchor around the region hull;
- `labelMargin`: non-negative pixel margin from that edge.

The default remains compatible with current rendering: top-left label placement
with the historical 12 px top and 18 px left offsets when no explicit placement
or margin is configured.

Supported positions:

- `topLeft`
- `topCenter`
- `topRight`
- `rightTop`
- `rightCenter`
- `rightBottom`
- `bottomRight`
- `bottomCenter`
- `bottomLeft`
- `leftTop`
- `leftCenter`
- `leftBottom`

Corner aliases render at the same visual corner. For example, `topRight` and
`rightTop` both anchor the label at the top-right corner. The alternate names
allow authors to express whether they are thinking from the top edge or the
right edge.

`labelMargin` only affects label placement. It does not resize the region hull
or move member nodes. Authors should keep using:

- `headerPadding` when a top-edge label needs vertical room;
- `paddingX` and `paddingY` when side or bottom labels need member clearance;
- `minWidth` and `minHeight` when very small regions need stable shape.

## Validation

The semantic linter validates supported region `labelPosition` values and that
`labelMargin` is non-negative. JSON schema autocomplete exposes the combined
label-position value set because the `style` schema is shared across entity
kinds; semantic lint remains the context-specific authority.
