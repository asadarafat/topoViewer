## What This Demonstrates

One topology, stylesheet, and mapper bundle can move through Studio,
documentation embeds, and Grafana packaging without changing object identity.

## Expected Result

Two named nodes render with one directed physical link. The mapper resolves a
`topoviewer_link_up` sample carrying `link_id: edge-a-core-b` to that link.

## What To Inspect

Inspect stable IDs in `topology.yaml`, reusable link policy in
`stylesheet.yaml`, and the runtime join contract in `mapper.yaml`.

## Use When

Use this bundle when validating a new authoring or consumer surface against the
portable TopoViewer source contract.
