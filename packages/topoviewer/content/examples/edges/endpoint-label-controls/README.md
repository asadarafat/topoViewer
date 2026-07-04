Use endpoint labels when the two ends of an edge need visible port names. This
example keeps circle and square arrow markers as geometry only, then renders
`sourceLabel` and `targetLabel` as styled endpoint annotations with automatic
placement.

`endpointLabelDistance` moves labels away from their endpoint along the edge. `endpointLabelSideOffset` moves labels perpendicular to the edge during auto placement. `sourceLabelXOffset`, `sourceLabelYOffset`, `targetLabelXOffset`, and `targetLabelYOffset` are final manual nudges after auto placement.

Use the center `label` for the relationship name. Use `sourceLabel` and
`targetLabel` for interface names. Do not put interface names inside arrow
markers; arrows stay marker geometry so the label engine can place endpoint
text independently.
