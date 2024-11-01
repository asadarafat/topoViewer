# Containerlab Topology with Group Organization

TopoViewer supports organizing nodes into hierarchical groups within the topology by using the `group` attribute in the Containerlab configuration. This feature allows you to categorize nodes under specific parent groups, improving the structure and readability of the network layout in TopoViewer.

## Group Configuration

Each node can be assigned a `group` attribute, which TopoViewer interprets as a parent grouping. This grouping adds logical structure to the network by visually clustering nodes that share common roles or functions.

### Defining a Group

To assign a node to a group, use the `group` attribute in the node configuration:

```yaml
group: "<Group Name>"
```

### Example Usage

Below is an example of how the `group` attribute can be used to organize nodes in the topology. In this case, spine nodes are grouped under "Data Center Spine" and leaf nodes can be organized under another relevant group, such as "Data Center Leaf."

```yaml
topology:  
  nodes:
    Spine-01:
      kind: srl
      image: ghcr.io/nokia/srlinux
      group: "Data Center Spine"
      labels:
        topoViewer-role: spine

    Spine-02:
      kind: srl
      image: ghcr.io/nokia/srlinux
      group: "Data Center Spine"
      labels:
        topoViewer-role: spine

    Leaf-01:
      kind: srl
      image: ghcr.io/nokia/srlinux
      group: "Data Center Leaf"
      labels:
        topoViewer-role: leaf

    Leaf-02:
      kind: srl
      image: ghcr.io/nokia/srlinux
      group: "Data Center Leaf"
      labels:
        topoViewer-role: leafcontainerlab-topology-definition-group.png
```

### Group Visualization Example

Below is an example screenshot illustrating how TopoViewer displays nodes grouped under parent categories using the `group` attribute in the Containerlab topology.

![Group Visualization](containerlab-topology-definition-group.png)

In this example:
- Nodes assigned to the **Data Center Spine** group (Spine-01 and Spine-02) are visually clustered together within a labeled boundary.
- Nodes assigned to the **Data Center Leaf** group (Leaf-01 through Leaf-04) are similarly clustered under a separate labeled boundary.

Grouping nodes in this way enhances readability by clearly defining functional areas within the network, making it easier to distinguish between different layers or segments.

## Benefits of Grouping

By defining groups, you:
- Improve the logical organization of nodes in TopoViewer.
- Create clear, visual distinctions between different layers or roles in your network.
- Enhance readability, particularly in larger or complex topologies.

Grouping can be combined with the `topoViewer-role` labels to provide both role-specific icons and structured node organization, making your topology visually intuitive and easy to navigate.
