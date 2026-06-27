## Design

### Default contract

The canonical default node shape should be `rectangle`.

This matches the existing default dimensions:

```yaml
width: 82
height: 60
```

The core rule is:

> If users omit `shape`, authored `width` and `height` must behave as ordinary
> width and height.

That makes the default intuitive for new users and avoids hidden aspect-ratio
correction.

### Shape semantics

TopoViewer should document these practical semantics:

| Shape | Width/height behavior | Intended use |
| --- | --- | --- |
| `rectangle` | Independent width and height | Default network node body |
| `square` | Equal-width/equal-height body | Explicit square node |
| `ellipse` | Independent width and height | Oval node |
| `circle` | Equal-width/equal-height body | Explicit circular node |

Other named shapes follow the same general rule as authored geometry, but the
strict validation only needs to target `square` and `circle` because those names
promise aspect-locked bodies.

### Resolved body box

Runtime should not let each layer derive size independently. Add a helper with a
small, stable contract, for example:

```ts
interface NodeBodyBox {
  authoredWidth: number;
  authoredHeight: number;
  bodyWidth: number;
  bodyHeight: number;
  iconWidth: number;
  iconHeight: number;
  edgeAnchorWidth: number;
  edgeAnchorHeight: number;
  aspectLocked: boolean;
}
```

For `rectangle` and `ellipse`, `bodyWidth/bodyHeight` are the authored/default
width/height.

For `square` and `circle`, `bodyWidth/bodyHeight` must use the same dimension.
Do not silently choose between two unequal authored dimensions.

The aspect-locked dimension rules are:

- if both `width` and `height` are authored, they must be equal;
- if only `width` is authored, use that value for both width and height;
- if only `height` is authored, use that value for both width and height;
- if neither is authored, use a documented canonical aspect-locked default
  size.

The canonical aspect-locked fallback is the default node height (`60`). This
keeps explicit `shape: square` and `shape: circle` compact and avoids silently
stretching them to the rectangular default body.

The resolved body box must feed:

- React Flow node width/height;
- node wrapper CSS variables;
- SVG viewport/container dimensions;
- icon/image default dimensions;
- edge anchor width/height;
- underlay/outline sizing.

This is the important part: the edge should connect to the same body that the
user sees.

### Validation behavior

Add error-level semantic validation for explicit aspect-locked shapes with two
authored unequal dimensions:

```yaml
shape: square
width: 96
height: 56
```

The message should be practical:

> `shape: square` requires equal width and height. Use equal dimensions, omit
> one dimension, or use `shape: rectangle` for a stretched body.

Same for `circle`, recommending `ellipse`.

These errors should cover both selector style declarations and inline
object-level style declarations when lint has enough context.

### Docs and examples

Docs must make this clear without overexplaining:

- Default behavior section says nodes default to `shape: rectangle`.
- Node style table `shape` row lists accepted values and says default is
  `rectangle`.
- Shape examples show rectangle, square, ellipse, and circle side by side.
- YAML assist should recommend `rectangle` when users set unequal width/height
  without a shape.

Harness templates should avoid relying on omitted shape when they intentionally
want square/circle router icons. Declare `shape: square` explicitly in those
templates.

### Compatibility

This is a visual default change for YAML that omits node `shape`. Existing YAML
that explicitly declares `shape` is preserved.

Because TopoViewer is still pre-1.0, the more predictable default is worth the
change. The docs should call out the behavior clearly so future users do not
need to know the previous square default.

### Test strategy

Add focused coverage before broad visual checks:

1. Unit test default node style compilation resolves omitted shape to
   `rectangle`.
2. Unit test omitted shape with rectangular dimensions keeps rectangular body
   and edge anchor dimensions.
3. Unit test `shape: square` and `shape: circle` derive the missing dimension
   when only one dimension is authored.
4. Unit test `shape: square` and `shape: circle` reject two unequal authored
   dimensions.
5. Validation tests for unequal square/circle width/height errors.
6. Docs/reference tests proving default shape text and accepted values remain
   present.
7. Playwright parity smoke for harness, MkDocs, and Zensical using the same
   graph-basic YAML.

## Risks

- Some existing examples may visually change if they relied on omitted
  `shape`. Mitigation: make intentional square/circle examples explicit.
- Edge anchor changes can affect screenshot baselines. Mitigation: use the
  resolved body box consistently and update expected visuals deliberately.
- Validation may reject existing examples that used unequal square or circle
  dimensions. Mitigation: update those examples to explicit rectangle/ellipse
  when stretched shapes are intended, or equal dimensions when square/circle is
  intended.
