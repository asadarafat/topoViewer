---
hide:
  - toc
---

# Kubernetes service map

## A Service Map For Kubernetes

Kubernetes dashboards are usually good at showing object state. You can see
Services, Deployments, Pods, custom resources, events, and health. That is
necessary, but it does not always answer the first operational question:

```text
What is this platform actually connected to?
```

That question matters when the GUI shows a large platform and the operator has
to understand the path from a user-facing endpoint into the control plane, then
from the control plane into the infrastructure it manages. Object lists can show
that things exist. They do not naturally show how the objects form a system.

This example uses Nokia EDA as the case study, but the pattern is generic
Kubernetes. EDA is useful here because it is not just a toy namespace: it has an
operator-facing UI/API, many Kubernetes services and deployments, EDA custom
resources, simulated network nodes, NPP pods, and runtime bindings between the
platform and the managed topology.

TopoViewer is added as the relationship view beside the Kubernetes or EDA GUI.
The GUI remains the place to inspect detailed object status and perform actions.
TopoViewer provides the missing service map: a visual, inspectable graph that
shows how platform objects are connected.

## Turning Inventory Into A Diagram

The input is ordinary platform inventory. A collector reads the Kubernetes API
and the EDA API, then writes the result as TopoViewer YAML.

```topoviewer
topology: examples/integration/kubernetes-service-map/service-map-flow-topology.yaml
stylesheet: examples/integration/kubernetes-service-map/service-map-flow-stylesheet.yaml
height: 360px
controls: false
controlsOpen: false
title: Inventory to service map
```

The important detail is that the diagram is not hand drawn. Services,
deployments, pods, `NetworkTopology`, and `TopoNode` objects become named graph
nodes. Selectors, ownership, containment, runtime calls, simulator bindings, and
NPP control relationships become typed graph links.

That gives the map a useful property: every visible object can still carry the
facts it came from. For example, Kubernetes selectors, ports, image names,
object roles, and link types remain available in labels and data. The diagram
is visual, but it is still tied to source inventory.

## Reading The EDA Map

Start at the operator entry point. The left side of the map shows the browser
entering the `try-eda` service and then reaching `eda-api`. From there, the
service-selector relationships show which deployments back the visible service
surface, and the runtime-flow relationships show which internal services the
API depends on.

When the service surface becomes too noisy, turn attention to the
`topology-runtime` layer. That layer follows the EDA-specific part of the story:
the `NetworkTopology` custom resource contains `TopoNode` objects for `leaf1`,
`leaf2`, and `spine1`; each `TopoNode` is bound to a simulator deployment; NPP
pods maintain control connectivity to those managed nodes.

The regions are intentionally interactive. Expanded region hulls group related
areas such as API/UI, identity/persistence, control engines, topology runtime,
and simulated fabric. Click a region hull to collapse that area into a summary
node. Click the summary node to expand it again. Drag a region hull when the
operator view needs a cleaner arrangement without losing the semantic grouping.

## Why TopoViewer Is The Useful Piece

Without a topology layer, this story is spread across multiple GUI panels and
commands. You can inspect a Service, then inspect a Deployment, then inspect a
Pod, then inspect a custom resource, but the operator still has to hold the
relationship model in their head.

TopoViewer changes the artifact. The output is not a screenshot of the GUI and
not a static architecture drawing. It is a topology-as-code view:

- `topology.yaml` records what exists and how objects relate;
- `stylesheet.yaml` records how those objects should be read visually;
- layers separate the Kubernetes service surface from the topology runtime;
- regions group related operational areas;
- attention aggregation collapses dense areas without deleting context.

The result is a service map that can live in documentation, the browser harness,
or an operational surface while still being regenerated from real platform data.

## What You Should See

The live viewport should open as a Kubernetes service map with both
`control-plane` and `topology-runtime` enabled. The reader should be able to
trace the path from `Browser` to `try-eda` to `eda-api`, follow selector edges
from services to deployments, and then switch focus to the runtime topology
around `NetworkTopology`, `TopoNode`, simulator deployments, and NPP pods.

The map should render 59 nodes, at least 52 visible edges, and six region hulls.
Expanded region hulls should be draggable and collapsible. Collapsed summaries
should stay visible in the same layer as their member objects and expand again
when clicked.

## Reading The YAML

Use the live viewport first, then look at the YAML to see how the visual story
is encoded.

- In the topology YAML, inspect `graph.nodes` to see how Kubernetes services,
  deployments, pods, EDA resources, and managed network nodes are represented as
  named objects.
- Inspect `graph.links` and `labels.link` to see the relationship vocabulary:
  `entry`, `service-route`, `selector`, `runtime-flow`, `topology`,
  `runtime-binding`, `control`, and `owns`.
- Inspect `data.selector`, `data.ports`, and `data.images` to see how raw
  Kubernetes facts stay attached to the graph objects.
- Inspect the stylesheet YAML to see how the same object families are styled
  without changing the source topology facts.
- Inspect `attention.aggregate` to see how collapsible region summaries are
  declared.

## Applying The Pattern

Use this pattern when a Kubernetes-hosted platform has a useful GUI, but the GUI
does not make the platform shape obvious enough. The pattern works best when
the operator needs to understand relationships before drilling into object
details.

It is especially useful for platform teams, SRE teams, and network automation
teams that need to explain how a Kubernetes control plane connects to the
infrastructure it manages.

## Summary

The reusable pattern is simple:

1. Collect platform inventory from Kubernetes and any domain API, such as EDA.
2. Convert real objects into stable TopoViewer nodes.
3. Convert operational relationships into typed TopoViewer links.
4. Keep raw object facts in labels and data.
5. Use stylesheet rules to make object families readable.
6. Use layers and collapsible regions to keep dense systems usable.

For your own use case, start with the operator question you want the GUI to
answer. Then model only the objects and relationships required to answer that
question. TopoViewer becomes valuable when the map explains the system shape
without forcing the reader to reverse-engineer it from tables, command output,
or screenshots.

=== "Live Viewport"

    ```topoviewer
    topology: ../integration/kubernetes-service-map/topology.yaml
    stylesheet: ../integration/kubernetes-service-map/stylesheet.yaml
    height: 760px
    controls: true
    controlsOpen: false
    title: Kubernetes service map
    selectedLayerIds:
      - control-plane
      - topology-runtime
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/stylesheet.yaml"
    ```
