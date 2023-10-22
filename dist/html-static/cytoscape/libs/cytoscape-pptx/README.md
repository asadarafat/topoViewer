# cytoscape-pptx

Enables the export of a cytoscape graph to powerpoint

## install

install cytoscape https://js.cytoscape.org

install pptxgenjs https://github.com/gitbrent/PptxGenJS

install cytoscape-pptx:

```
npm install cytoscape-pptx
```

## usage example

```javascript
import pptxgen from "pptxgenjs";
import { pptxAddSlide, pptxGetLayouts } from "cytoscape-pptx";
import cytoscape from "cytoscape";

var cy = cytoscape({
  container: document.getElementById("cy"), // container to render in

  elements: [
    // list of graph elements to start with
    {
      // node a
      data: { id: "a" },
    },
    {
      // node b
      data: { id: "b" },
    },
    {
      // edge ab
      data: { id: "ab", source: "a", target: "b" },
    },
  ],

  style: [
    // the stylesheet for the graph
    {
      selector: "node",
      style: {
        "background-color": "#666",
        label: "data(id)",
      },
    },

    {
      selector: "edge",
      style: {
        width: 3,
        "line-color": "#ccc",
        "target-arrow-color": "#ccc",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
      },
    },
  ],

  layout: {
    name: "grid",
    rows: 1,
  },
});

//get overview of built in layout sizes
console.log(pptxGetLayouts());

//default options
let defaultOptions = {
  width: 10, //inches, set to 0 for auto calculation which is usefull for large graphs,
  height: 5.625, //inches, set to 0 for auto calculation which is usefull for large graphs,
  marginTop: 0.2, //inches
  marginLeft: 0.2, //inches
  segmentedEdges: true, // if the edge is segmented, export it with bend points (true), or as straight line (false). Control points (curved edges) are not supported
};

//create presentation
const pres = new pptxgen();

//add slide width default options....
pptxAddSlide(pres, cy);
pres.writeFile();

//OR with specified options....
pptxAddSlide(pres, cy, { options: defaultOptions });
pres.writeFile();

//OR with built in layout sizes
pptxAddSlide(pres, cy, {
  options: pptxGetLayouts().find((x) => x.name === "WIDE"),
});
pres.writeFile();
```
