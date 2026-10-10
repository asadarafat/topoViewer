---
hide:
  - toc
---

# Complete network demo

Read this integrated example in three lanes: controller relationships at the top,
physical routers and their nested VPN services in the middle, and explanatory
notes below. The view uses a fixed manual layout so annotations remain attached
to the objects they explain.

The five routers share AS 65000. R05 belongs to both IS-IS levels; it is the
boundary router between those domains. L3VPN 1321 joins the two provider edges
through the programmed SR-TE transport path. The customer service, controller
sessions and physical links remain distinct graph objects. PCEP connectors are
undirected sessions; the BGP-LS arrow shows the link-state feed to the controller,
not the direction of every protocol message.

Open the controls to reveal one layer at a time. **Show link/path labels** adds
protocol names; hide diagram primitives when tracing the network itself.
The displayed state is an authored teaching model, not live routing or telemetry.

IS-IS is the underlay routing protocol. AS means autonomous system; L3VPN is a
layer 3 virtual private network. SR-TE means segment-routing traffic engineering,
SID is a segment identifier, and AC is an attachment circuit. BGP-LS supplies
link-state information; PCEP is the path computation element protocol.

Shapes, pin-attached leaders, callouts and the locked export frame explain the
view while routers, links, regions, child services and paths remain graph facts.

[PCEP sessions](https://www.rfc-editor.org/rfc/rfc5440.html) carry exchanges
between the PCC and PCE; the session connector does not specify a traffic direction.

## Expected Result

An integrated network example combining graph facts, regions, child nodes, paths, shapes, and callouts.

## Try It

1. Copy the two YAML tabs into your own project.
2. In `diagram.callouts.0` in topology.yaml, set `diagram.callouts.0.labels.name` to `"Inspect this object before proceeding."`.
3. Reload. The annotation text changes without creating or altering a graph relationship.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: ../examples/integration/complete-network-demo/topology.yaml
    stylesheet: ../examples/integration/complete-network-demo/stylesheet.yaml
    height: 1000px
    controls: true
    controlsOpen: false
    title: Complete network demo
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/complete-network-demo/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/complete-network-demo/stylesheet.yaml"
    ```
