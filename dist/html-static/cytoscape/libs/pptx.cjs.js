'use strict';

function pptxAddSlideCy(presentation, cy, { options }) {
  // calculate sizes and scale
  let graphSize = cy.elements().boundingBox();
  let thisOptions = {
    ...defaultOptions(),
    ...options,
  };
  if (!(thisOptions.width && thisOptions.height)) {
    thisOptions = addSizeToOptions({ thisOptions, graphSize });
  }

  console.log(thisOptions);

  let scale = calcScale(graphSize, thisOptions);
  thisOptions.marginTop = scale.centerY; //center graph
  thisOptions.marginLeft = scale.centerX; //center graph

  let slideSize = { scale: scale.scale, graphSize, options: thisOptions };
  const slide = createSlide({ presentation, options: thisOptions });

  //draw parents first so they come under the rest of the nodes
  let parents = cy.nodes(":parent");
  let ultimoParents = parents.nodes(":orphan");
  let nonUltimoParents = parents.difference(ultimoParents);
  drawNodes({ slide, nodes: ultimoParents, slideSize });
  drawNodes({ slide, nodes: nonUltimoParents, slideSize });

  //draw non group nodes
  drawNodes({ slide, nodes: cy.nodes(":childless"), slideSize });

  //draw edges
  let edges = cy.edges();
  drawEdges({
    slide,
    edges,
    slideSize,
    segmentedEdges: thisOptions.segmentedEdges,
  });
}

function createSlide({ presentation, options }) {
  presentation.defineLayout({
    name: "LAYOUT",
    width: options.width,
    height: options.height,
  });
  presentation.layout = "LAYOUT";
  return presentation.addSlide();
}

function pptxGetLayoutsCy() {
  const standardLayouts = [
    {
      name: "16x9",
      width: 10,
      height: 5.625,
    },
    {
      name: "16x10",
      width: 10,
      height: 6.25,
    },
    {
      name: "4x3",
      width: 10,
      height: 7.5,
    },
    {
      name: "WIDE",
      width: 13.3,
      height: 7.5,
    },
    {
      name: "A3",
      width: 16.5,
      height: 11.7,
    },
    {
      name: "A4",
      width: 11.7,
      height: 8.3,
    },
    {
      name: "AUTO",
      width: 0,
      height: 0,
    },
  ];
  return standardLayouts;
}

function defaultOptions() {
  return {
    width: pptxGetLayoutsCy()[0].width,
    height: pptxGetLayoutsCy()[0].height,
    marginTop: 1,
    marginLeft: 0.2,
    segmentedEdges: true,
  };
}
function addSizeToOptions({ thisOptions, graphSize }) {
  return {
    ...thisOptions,
    width: graphSize.w / 100,
    height: graphSize.h / 100,
  };
}

function drawEdges({ slide, edges, slideSize, segmentedEdges }) {
  edges.forEach((e, i) => {
    let edgeStyle = e.style();

    let lineprop = {
      color: rgb2Hex(edgeStyle.lineColor),
      width: 100 * slideSize.scale * px2Num(edgeStyle.width),
      endArrowType: "triangle",
      dashType:
        edgeStyle.lineStyle === "solid"
          ? "solid"
          : edgeStyle.lineStyle === "dashed"
          ? "lgDash"
          : "lgDashDotDot",
    };
    // if it is a segmented edge, then draw a custom shape, otherwise a normal line

    console.log(segmentedEdges, e.segmentPoints());
    if (segmentedEdges && e.segmentPoints()) {
      slide.addShape("custGeom", {
        ...getEdgeSegments({ e, slideSize }),
        line: lineprop,
      });
    } else {
      slide.addShape("line", {
        ...getEdgeLocation({ e, slideSize }),
        line: lineprop,
      });
    }

    // if edge contains a name, add a textbox for it
    if (edgeStyle.label) {
      let midpoint = e.midpoint();
      // if it is a segmented edge, but we draw it as a straight line, recalculate the midpoint for the label
      // cpntrol points (curved edges) are not supported yet, and drawn as straight lines
      if ((!segmentedEdges && e.segmentPoints()) || e.controlPoints()) {
        midpoint = {
          x: (e.sourceEndpoint().x + e.targetEndpoint().x) / 2,
          y: (e.sourceEndpoint().y + e.targetEndpoint().y) / 2,
        };
      }
      slide.addText(edgeStyle.label, {
        ...getLabelLocation({ slideSize, midpoint }),
        align: "center",
        margin: 0,
        fontSize: calcFontSize(edgeStyle.fontSize, slideSize.scale),
      });
    }
  });
}
function updateBbx({ bbx, x, y }) {
  if (Object.keys(bbx).length === 0) return { x1: x, x2: x, y1: y, y2: y };
  else
    return {
      x1: bbx.x1 < x ? bbx.x1 : x,
      x2: bbx.x2 > x ? bbx.x2 : x,
      y1: bbx.y1 < y ? bbx.y1 : y,
      y2: bbx.y2 > y ? bbx.y2 : y,
    };
}
function getEdgeSegments({ e, slideSize }) {
  let edgeSegments = [];
  edgeSegments.push({ ...e.sourceEndpoint() });
  e.segmentPoints().forEach((sp) => edgeSegments.push({ ...sp }));
  edgeSegments.push({ ...e.targetEndpoint() });

  //calculate the bounding box
  let bbx = {};
  edgeSegments.forEach((pp) => {
    bbx = updateBbx({ bbx, ...pp });
  });

  // calculate the relative segment positions, relative to the start of the bounding box
  edgeSegments.forEach((pp) => {
    pp.x = (pp.x - bbx.x1) * slideSize.scale;
    pp.y = (pp.y - bbx.y1) * slideSize.scale;
  });

  return {
    points: edgeSegments,
    x: calcX({ slideSize, elementSize: { x1: bbx.x1 } }),
    y: calcY({ slideSize, elementSize: { y1: bbx.y1 } }),
    w: calcW({ elementSize: { w: bbx.x2 - bbx.x1 }, slideSize }),
    h: calcH({ elementSize: { h: bbx.y2 - bbx.y1 }, slideSize }),
  };
}

function drawNodes({ slide, nodes, slideSize }) {
  nodes.forEach((n, i) => {
    let nodeSize = n.boundingBox();
    let nodeStyle = n.style();
    let nodeLocation = getNodeLocation({ nodeSize, slideSize });

    let shapeparams = {
      ...getShape(nodeStyle, nodeLocation),
      ...nodeLocation,
      color: rgb2Hex(nodeStyle.color),
      fill: {
        color: rgb2Hex(nodeStyle.backgroundColor),
        transparency: 100 - nodeStyle.backgroundOpacity * 100,
      },
      line: {
        color: rgb2Hex(nodeStyle.borderColor),
        width: 100 * slideSize.scale * px2Num(nodeStyle.borderWidth),
      },
      align: "center",
      valign: nodeStyle.textValign,
      fontSize: calcFontSize(nodeStyle.fontSize, slideSize.scale),
      margin: 0,
    };
    if (nodeStyle.shape === "round-rectangle") {
      shapeparams.rectRadius = slideSize.scale * 10;
    }
    slide.addText(nodeStyle.label, shapeparams);
  });
}

function getLabelLocation({ slideSize, midpoint }) {
  let x1 = midpoint.x;
  let y1 = midpoint.y;

  return {
    x: calcX({ slideSize, elementSize: { x1 } }) - 0.5,
    y: calcY({ slideSize, elementSize: { y1 } }),
    w: 1,
    h: 0.1,
  };
}
function getEdgeLocation({ e, slideSize }) {
  let edgeSize = {
    x1: e.sourceEndpoint().x,
    y1: e.sourceEndpoint().y,
    x2: e.targetEndpoint().x,
    y2: e.targetEndpoint().y,
    h: e.targetEndpoint().y - e.sourceEndpoint().y,
    w: e.targetEndpoint().x - e.sourceEndpoint().x,
  };
  let x = calcX({ elementSize: edgeSize, slideSize });
  let y = calcY({ elementSize: edgeSize, slideSize });
  let w = calcW({ elementSize: edgeSize, slideSize });
  let h = calcH({ elementSize: edgeSize, slideSize });
  let flipV = false;
  let flipH = false;

  // height and width cannot be negative, so correct and rotate to make them positive
  if (w >= 0 && h >= 0) {
    flipV = false;
    flipH = false;
  } else if (w < 0 && h >= 0) {
    flipV = false;
    flipH = true;
    x = x + w;
    w = -w;
  } else if (w < 0 && h < 0) {
    flipV = true;
    flipH = true;
    x = x + w;
    w = -w;
    y = y + h;
    h = -h;
  } else if (w >= 0 && h < 0) {
    flipV = true;
    flipH = false;
    y = y + h;
    h = -h;
  }
  return { x: x, y: y, w: w, h: h, flipH, flipV };
}
function getNodeLocation({ nodeSize, slideSize }) {
  let x = calcX({ elementSize: nodeSize, slideSize });
  let y = calcY({ elementSize: nodeSize, slideSize });
  let w = calcW({ elementSize: nodeSize, slideSize });
  let h = calcH({ elementSize: nodeSize, slideSize });

  return { x: x, y: y, w: w, h: h };
}

function getShape(nodeStyle, nodeLocation) {
  // translate cytoscape shapes to powerpoint shapes
  let shapesMapping = {
    ellipse: "ellipse",
    triangle: "_triangle",
    "round-triangle": "_triangle",
    rectangle: "rect",
    "round-rectangle": "roundRect",
    "bottom-round-rectangle": "_bottomcutrectange",
    "cut-rectangle": "octagon",
    barrel: "_barrel",
    rhomboid: "_rhomboid",
    diamond: "diamond",
    "round-diamond": "trapezoid",
    pentagon: "_pentagon",
    "round-pentagon": "_pentagon",
    hexagon: "_hexagon",
    "round-hexagon": "_hexagon",
    "concave-hexagon": "_concavehexagon",
    heptagon: "_heptagon",
    "round-heptagon": "_heptagon",
    octagon: "_octagon",
    "round-octagon": "_octagon",
    star: "_star",
    tag: "_tag",
    "round-tag": "rightArrow",
    vee: "_vee",
  };

  let shape = shapesMapping[nodeStyle.shape];

  if (shape[0] !== "_") {
    // shape is not available in powerpoint, so create a custom shape
    return { shape };
  } else {
    return {
      shape: "custGeom",
      points: getShapePoints(shape, nodeLocation),
    };
  }
}
function getShapePoints(shape, nodeLocation) {
  let width = nodeLocation.w;
  let height = nodeLocation.h;
  let customShapes = {
    _triangle: [
      { x: 0.0, y: 1.0 },
      { x: 0.5, y: 0.0 },
      { x: 1.0, y: 1.0 },
      { x: 0.0, y: 1.0 },
    ],
    _tag: [
      { x: 0.0, y: 0.0 },
      { x: 0.66, y: 0.0 },
      { x: 1.0, y: 0.5 },
      { x: 0.66, y: 1.0 },
      { x: 0.0, y: 1.0 },
      { x: 0.0, y: 0.0 },
    ],
    _vee: [
      { x: 0.0, y: 0.0 },
      { x: 0.5, y: 0.34 },
      { x: 1.0, y: 0.0 },
      { x: 0.5, y: 1.0 },
      { x: 0.0, y: 0.0 },
    ],
    _rhomboid: [
      { x: 0.0, y: 0.0 },
      { x: 0.66, y: 0.0 },
      { x: 1.0, y: 1.0 },
      { x: 0.33, y: 1.0 },
      { x: 0.0, y: 0.0 },
    ],
    _pentagon: [
      { x: 0.0, y: 0.4 },
      { x: 0.5, y: 0.0 },
      { x: 1.0, y: 0.4 },
      { x: 0.8, y: 1.0 },
      { x: 0.2, y: 1.0 },
      { x: 0.0, y: 0.4 },
    ],
    _hexagon: [
      { x: 0.0, y: 0.5 },
      { x: 0.2, y: 0.0 },
      { x: 0.8, y: 0.0 },
      { x: 1.0, y: 0.5 },
      { x: 0.8, y: 1.0 },
      { x: 0.2, y: 1.0 },
      { x: 0.0, y: 0.5 },
    ],
    _heptagon: [
      { x: 0.0, y: 0.6 },
      { x: 0.15, y: 0.2 },
      { x: 0.5, y: 0.0 },
      { x: 0.85, y: 0.2 },
      { x: 1.0, y: 0.6 },
      { x: 0.7, y: 1.0 },
      { x: 0.3, y: 1.0 },
      { x: 0.0, y: 0.6 },
    ],
    _concavehexagon: [
      { x: 0.0, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 0.85, y: 0.5 },
      { x: 1.0, y: 1.0 },
      { x: 0.0, y: 1.0 },
      { x: 0.15, y: 0.5 },
      { x: 0.0, y: 0.0 },
    ],
    _octagon: [
      { x: 0.0, y: 0.3 },
      { x: 0.3, y: 0.0 },
      { x: 0.7, y: 0.0 },
      { x: 1.0, y: 0.3 },
      { x: 1.0, y: 0.7 },
      { x: 0.7, y: 1.0 },
      { x: 0.3, y: 1.0 },
      { x: 0.0, y: 0.7 },
      { x: 0.0, y: 0.3 },
    ],
    _star: [
      { x: 0.0, y: 0.4 },
      { x: 0.33, y: 0.27 },
      { x: 0.5, y: 0.0 },
      { x: 0.67, y: 0.27 },
      { x: 1.0, y: 0.38 },
      { x: 0.8, y: 0.67 },
      { x: 0.8, y: 1.0 },
      { x: 0.5, y: 0.9 },
      { x: 0.2, y: 1.0 },
      { x: 0.2, y: 0.67 },
      { x: 0.0, y: 0.4 },
    ],
    _barrel: [
      { x: 0.0, y: 0.1 },
      { x: 0.2, y: 0.0 },
      { x: 0.8, y: 0.0 },
      { x: 1.0, y: 0.1 },
      { x: 1.0, y: 0.9 },
      { x: 0.8, y: 1.0 },
      { x: 0.2, y: 1.0 },
      { x: 0.0, y: 0.9 },
      { x: 0.0, y: 0.1 },
    ],

    _bottomcutrectange: [
      { x: 0.0, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 1.0, y: 0.8 },
      { x: 0.95, y: 0.95 },
      { x: 0.8, y: 1.0 },
      { x: 0.2, y: 1.0 },
      { x: 0.05, y: 0.95 },
      { x: 0.0, y: 0.8 },
      { x: 0.0, y: 0.0 },
    ],
  };
  let thisShape = customShapes[shape];
  thisShape.forEach((tp) => {
    tp.x = tp.x * width;
    tp.y = tp.y * height;
  });
  return thisShape;
}
function calcScale(bbx, options) {
  let heightInch = options.height - 2 * options.marginTop;
  let widthInch = options.width - 2 * options.marginLeft;
  let scaleH = heightInch / bbx.h;
  let scaleW = widthInch / bbx.w;
  let scale = Math.min(scaleH, scaleW, 0.01);

  // calculate margin to center graph in slide
  let centerY = (options.height - scale * bbx.h) / 2;
  let centerX = (options.width - scale * bbx.w) / 2;
  return { scale, centerY, centerX };
}
function calcFontSize(fontSize, scale) {
  return (px2Num(fontSize) - 5) * scale * 100;
}

function calcX({ elementSize, slideSize }) {
  let res =
    (elementSize.x1 - slideSize.graphSize.x1) * slideSize.scale +
    slideSize.options.marginLeft;
  return res;
}
function calcY({ elementSize, slideSize }) {
  let res =
    (elementSize.y1 - slideSize.graphSize.y1) * slideSize.scale +
    slideSize.options.marginTop;
  return res;
}
function calcW({ elementSize, slideSize }) {
  let res = elementSize.w * slideSize.scale;
  return res;
}
function calcH({ elementSize, slideSize }) {
  let res = elementSize.h * slideSize.scale;
  return res;
}

function rgb2Hex(color) {
  var arr = [];
  color.replace(/[\d+\.]+/g, function (v) {
    arr.push(parseFloat(v));
  });
  return arr.slice(0, 3).map(toHex).join("").toUpperCase();
}
function px2Num(px) {
  return parseFloat(px.replace("px", ""));
}
function toHex(int) {
  var hex = int.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

// exports.pptxAddSlideCy = pptxAddSlideCy;
// exports.pptxGetLayoutsCy = pptxGetLayoutsCy;
