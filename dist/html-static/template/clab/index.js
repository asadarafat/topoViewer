import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import popper from 'cytoscape-popper';


cytoscape.use(cola)
cytoscape.use(popper)

globalThis.cytoscape = cytoscape

console.log(cytoscape);
console.log(cola);
console.log(popper);