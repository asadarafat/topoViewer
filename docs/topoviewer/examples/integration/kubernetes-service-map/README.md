## Kubernetes Service Map From A Real Control Plane

Kubernetes already gives operators a strong API. `kubectl`, custom-resource
status, events, logs, and platform-specific UIs can all answer detailed object
questions. What they do not automatically provide is a compact relationship
map:

```text
Which service is the entry point, which workloads back it, and how does that
control plane connect to the topology it manages?
```

This example uses Nokia EDA as the concrete case study. The pattern is generic
Kubernetes: collect inventory from the Kubernetes API and domain resources,
convert stable objects into topology nodes, convert relationships into topology
links, then render the result with TopoViewer.

The flow below is the pattern this page demonstrates. It starts with inventory,
keeps conversion separate from styling, and ends with a service map that can be
reviewed, versioned, and rendered in more than one surface.

```topoviewer
topology: examples/integration/kubernetes-service-map/service-map-flow-topology.yaml
stylesheet: examples/integration/kubernetes-service-map/service-map-flow-stylesheet.yaml
height: 420px
controls: false
controlsOpen: false
title: Inventory to service map
```

## Inventory Collection

Inventory collection means reading source-of-truth objects and preserving their
identity before anything is styled. For this example, the source inventory is:

- Kubernetes `Service`, `Deployment`, and `Pod` objects in the EDA namespace;
- Kubernetes selectors and ownership relationships;
- EDA custom resources such as topology and node objects;
- selected runtime facts, including ports, image names, readiness, and status.

The checked-in example is a captured and curated topology derived from that kind
of inventory. The scaffold below captures raw Kubernetes JSON and selected
custom resources. The fourth argument is an optional `kubectl api-resources`
regular expression, so the same pattern can collect other domain resources
without rewriting the script.

??? example "Inventory collection scaffold"

    ```bash
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/collect-eda-kubernetes-inventory.sh"
    ```

Run it against a kubeconfig that can read the EDA namespaces:

```bash
bash packages/topoviewer/content/examples/integration/kubernetes-service-map/collect-eda-kubernetes-inventory.sh eda-system eda
```

If `kubectl` is bundled inside a local control-plane container instead of
installed on the host, pass the command explicitly:

```bash
KUBECTL='docker exec eda-demo-control-plane kubectl' \
  bash packages/topoviewer/content/examples/integration/kubernetes-service-map/collect-eda-kubernetes-inventory.sh eda-system eda
```

Collect a different custom-resource family by changing the discovery pattern:

```bash
bash packages/topoviewer/content/examples/integration/kubernetes-service-map/collect-eda-kubernetes-inventory.sh \
  eda-system eda eda-kubernetes-inventory 'networktopolog|toponode|myresource'
```

Expected result:

```text
eda-kubernetes-inventory/
  services.json
  deployments.json
  pods.json
  workload-summary.txt
  eda-namespaced-resource-types.txt
  eda-cluster-resource-types.txt
  <discovered-eda-resource>.json
```

Those files are not the final TopoViewer model. They are the raw input.

## Converter Contract

The converter is a script. In a production integration it would normally be a
small CLI in the same repository as the collector, with tests around every
relationship rule. In this example it is intentionally kept under 101 lines so
the pattern is easy to copy, audit, and replace.

The zoom-in below shows the converter as a parent process. The contained steps
read the JSON snapshots, derive deterministic topology identity, derive
relationships and parent groups, and write the topology contract that TopoViewer can
validate.

```topoviewer
topology: examples/integration/kubernetes-service-map/converter-flow-topology.yaml
stylesheet: examples/integration/kubernetes-service-map/converter-flow-stylesheet.yaml
height: 500px
controls: false
controlsOpen: false
title: Converter zoom-in
attention:
  query:
    ids:
      - converter-script
      - read-snapshots
      - derive-identity
      - derive-relationships
      - derive-attention
    mode: dim-context
```

The converter is the deliberate boundary between the platform API and
TopoViewer. It writes `topology.yaml` only. It should not decide the visual
design. Its job is to preserve stable object identity and turn platform
relationships into a diagram model that can be validated. Colors, icons, labels,
and link emphasis stay in `stylesheet.yaml`.

For this example, a converter maps inventory into the topology contract like
this:

- object identity becomes `graph.nodes[].id`;
- object names become `graph.nodes[].name`;
- object family and status become `labels`;
- ports, selectors, images, readiness, and status details become `data`;
- selectors, ownership, containment, runtime calls, and control relationships
  become `graph.links[]`;
- object families become parent nodes plus `graph.nodes[].parent`;
- Kubernetes and topology-runtime views become `graph.layers[]`;
- dense groups become `attention.aggregate.groups[]` so parent groups can collapse;
- visual policy stays in `stylesheet.yaml`, separate from collected facts.

??? example "Converter scaffold"

    ```javascript
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/convert-eda-kubernetes-inventory.mjs"
    ```

Run the scaffold against the inventory output:

```bash
node packages/topoviewer/content/examples/integration/kubernetes-service-map/convert-eda-kubernetes-inventory.mjs \
  eda-kubernetes-inventory \
  eda-kubernetes-inventory/topology.yaml
```

The generated topology is intentionally deterministic. Re-running the converter
against the same inventory should produce the same IDs, links, parent groups, and
attention groups. That makes the output reviewable in Git and usable in CI.

That separation matters. The same collected facts can be rendered as a compact
service dependency map, a Kubernetes ownership view, a topology runtime view, or
a Grafana overlay target without rewriting the source inventory. Layer hiding
uses the generated `graph.layers[]`; collapse and expand behavior uses the
generated parent groups in `attention.aggregate`.

## Reading The Service Map

The service map is the result of the collection and conversion workflow. It does
not replace `kubectl`, custom-resource status, logs, or platform operations
screens. It is a relationship view built from the same inventory an operator
already trusts.

The upper layer is the Kubernetes control-plane view for the EDA system. Service
nodes represent Kubernetes `Service` objects. Deployment nodes represent
Kubernetes `Deployment` objects. Pod nodes represent runtime Pods. Green
selector links show which deployments are selected by services. Blue runtime
links show service-to-service dependencies that are useful for reading the
platform flow.

The lower layer is the topology runtime view. The `NetworkTopology` resource
contains the `TopoNode` objects for `leaf1`, `leaf2`, and `spine1`. Those
`TopoNode` objects are backed by simulator deployments and pods. NPP pods keep
control connectivity to the managed nodes.

Parent groups organize the map into API/UI, identity and persistence, control
engines, applications and bootstrap services, topology runtime, and simulated
fabric. Clicking a parent group collapses its children into a summary node;
clicking the summary expands the group again.

```topoviewer
topology: examples/integration/kubernetes-service-map/topology.yaml
stylesheet: examples/integration/kubernetes-service-map/stylesheet.yaml
height: 620px
controls: true
controlsOpen: true
title: Kubernetes service map
```

## How TopoViewer Helps

Without a topology layer, the same investigation is spread across separate
commands: inspect a Service, follow selectors to Deployments, inspect Pods,
check custom resources, then remember how the pieces fit together.

TopoViewer turns that relationship model into a reusable artifact:

- `topology.yaml` records what exists and how objects relate;
- `stylesheet.yaml` records how object families should be read visually;
- layers separate the Kubernetes service surface from the topology runtime;
- parent groups keep related areas understandable without hiding their members;
- attention aggregation makes dense areas collapsible without deleting context.

The useful outcome is not a prettier object list. It is a service map that
explains the platform shape before the reader drills into any single object.

## Reusing The Pattern

Start with the operational question the map must answer. For this example, the
question is how an operator-facing EDA endpoint connects to the Kubernetes
workloads and topology runtime behind it.

For another platform, use the same sequence:

1. collect the standard Kubernetes objects and the domain-specific resources;
2. preserve stable object IDs so links and telemetry can attach later;
3. convert selectors, ownership, containment, and runtime relationships into
   typed links;
4. keep raw source facts in `labels` and `data`;
5. style object families separately from source facts;
6. use layers and collapsible parent groups to keep the view usable as the system
   grows.

TopoViewer becomes useful when the map explains the system shape without
forcing the reader to reconstruct it from tables, command output, or screenshots.
