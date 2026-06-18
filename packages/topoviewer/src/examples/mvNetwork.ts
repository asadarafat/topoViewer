import type { StylesheetDocument, TopologyDocument } from '../core/types';

export const mvNetworkTopology: TopologyDocument = {
  graph: {
    id: 'mv-network',
    layers: [
      { id: 'physical', name: 'Physical' },
      { id: 'igp', name: 'IGP' },
      { id: 'bgp', name: 'BGP / Controller' },
      { id: 'transport', name: 'Transport' },
      { id: 'service', name: 'Service' }
    ],
    nodes: [
      { id: 'R01', name: 'R01', labels: { node: 'router', vendor: 'nokia', role: 'pe' }, layers: ['physical', 'igp', 'bgp', 'transport', 'service'], position: [90, 260] },
      { id: 'R03', name: 'R03', labels: { node: 'router', vendor: 'juniper', role: 'p' }, layers: ['physical', 'igp', 'transport'], position: [320, 360] },
      { id: 'R05', name: 'R05', labels: { node: 'router', vendor: 'nokia', role: 'abr' }, data: { changedAt: '2026-06-12T09:15:00Z', revision: 42, severity: 'warning' }, layers: ['physical', 'igp', 'bgp', 'transport'], position: [610, 260] },
      { id: 'R07', name: 'R07', labels: { node: 'router', vendor: 'cisco', role: 'asbr' }, layers: ['physical', 'igp', 'bgp', 'transport'], position: [900, 170] },
      { id: 'R09', name: 'R09', labels: { node: 'router', vendor: 'nokia', role: 'pe' }, layers: ['physical', 'igp', 'bgp', 'transport', 'service'], position: [1110, 260] },
      { id: 'NSP', name: 'NSP', labels: { node: 'controller', app: 'nsp' }, icon: 'controller.nsp', layers: ['bgp'], position: [610, 70] },
      { id: 'VSR-NRC', name: 'VSR-NRC', labels: { node: 'controller', app: 'vsr-nrc' }, icon: 'controller.nrc', layers: ['bgp'], position: [610, 500] },
      { id: 'svc-1321-r01', name: '**L3VPN** ++1321++', labels: { node: 'service', service: 'l3vpn' }, parent: 'R01', layers: ['service'], position: [90, 350] },
      { id: 'svc-1321-r09', name: '*L3VPN* ~~old~~ 1321', labels: { node: 'service', service: 'l3vpn' }, parent: 'R09', layers: ['service'], position: [1110, 350] },
      { id: 'svc-1000-r01', name: '**1000** L3VPNs', labels: { node: 'service', service: 'l3vpn', scope: 'aggregate' }, data: { serviceCount: 1000 }, parent: 'R01', layers: ['service'], position: [90, 420] },
      { id: 'svc-1000-r09', name: '**1000** L3VPNs', labels: { node: 'service', service: 'l3vpn', scope: 'aggregate' }, data: { serviceCount: 1000 }, parent: 'R09', layers: ['service'], position: [1110, 420] }
    ],
    links: [
      { id: 'phy-R01-R03', name: 'R01 to R03 physical link', source: 'R01', target: 'R03', labels: { link: 'physical', role: 'core' }, layers: ['physical'] },
      { id: 'phy-R03-R05', name: 'R03 to R05 physical link', source: 'R03', target: 'R05', labels: { link: 'physical', role: 'core' }, layers: ['physical'] },
      { id: 'phy-R05-R07', name: 'R05 to R07 physical link', source: 'R05', target: 'R07', labels: { link: 'physical', role: 'core' }, layers: ['physical'] },
      { id: 'phy-R07-R09', name: 'R07 to R09 physical link', source: 'R07', target: 'R09', labels: { link: 'physical', role: 'core' }, layers: ['physical'] },
      { id: 'bgpls-R05-VSR', name: 'R05 to VSR-NRC BGP-LS session', source: 'R05', target: 'VSR-NRC', labels: { link: 'bgp', protocol: 'bgp-ls' }, data: { changedAt: '2026-06-12T09:20:00Z', revision: 43 }, layers: ['bgp'] },
      { id: 'pcep-R01-NSP', name: 'R01 to NSP PCEP session', source: 'R01', target: 'NSP', labels: { link: 'bgp', protocol: 'pcep' }, layers: ['bgp'] },
      { id: 'pcep-R09-NSP', name: 'R09 to NSP PCEP session', source: 'R09', target: 'NSP', labels: { link: 'bgp', protocol: 'pcep' }, layers: ['bgp'] },
      { id: 'transport-1321-carrier', name: 'SR-TE carrier for service 1321', source: 'R01', target: 'R09', labels: { link: 'transport', protocol: 'sr-te', role: 'carrier' }, layers: ['service'] },
      { id: 'svc-1321', name: 'L3VPN 1321 service overlay', source: 'svc-1321-r01', target: 'svc-1321-r09', parent: 'transport-1321-carrier', labels: { link: 'service', service: 'l3vpn' }, layers: ['service'] }
    ],
    paths: [
      { id: 'srte-1321-forward', name: 'SR-TE 1321', labels: { path: 'transport', protocol: 'sr-te' }, layers: ['transport', 'service'], sequence: ['R01', 'R03', 'R05', 'R07', 'R09'] },
      { id: 'svc-1000-stitched', name: '1000 L3VPN services', source: 'svc-1000-r01', target: 'svc-1000-r09', parent: 'srte-1321-forward', labels: { path: 'service', service: 'l3vpn', scope: 'aggregate' }, data: { serviceCount: 1000 }, layers: ['service'] }
    ],
    regions: [
      { id: 'isis-l1', name: 'IS-IS L1', labels: { region: 'igp', protocol: 'isis' }, parent: 'as65000', layers: ['igp'], members: ['R01', 'R03', 'R05'] },
      { id: 'isis-l2', name: 'IS-IS L2', labels: { region: 'igp', protocol: 'isis' }, parent: 'as65000', layers: ['igp'], members: ['R05', 'R07', 'R09'] },
      { id: 'as65000', name: 'AS 65000', labels: { region: 'bgp' }, layers: ['igp', 'bgp'], members: ['R01', 'R03', 'R05', 'R07', 'R09'] }
    ]
  },
  toggles: [
    { id: 'showRegions', name: 'Show regions', default: true },
    { id: 'showChildNodesInsideParents', name: 'Show child nodes inside parents', default: false },
    { id: 'showEdgeLabels', name: 'Show link/path labels', default: false }
  ]
};

export const mvNetworkStylesheet: StylesheetDocument = {
  layout: {
    mode: 'force',
    width: 1280,
    height: 720,
    iterations: 220,
    linkDistance: 185,
    chargeStrength: -620,
    collideRadius: 66
  },
  icons: {
    'router.generic': { glyph: 'R', fill: '#6ea8fe', stroke: '#d8e8ff' },
    'router.nokia': { glyph: 'N', fill: '#1148ff', stroke: '#b8c7ff' },
    'router.cisco': { glyph: 'C', fill: '#16a3b8', stroke: '#c8fbff' },
    'router.juniper': { glyph: 'J', fill: '#2fb344', stroke: '#d7ffdf' },
    'controller.nsp': { glyph: 'NSP', fill: '#ffb454', stroke: '#ffe4b8' },
    'controller.nrc': { glyph: 'NRC', fill: '#ffd166', stroke: '#fff2bd' },
    'service.l3vpn': { glyph: 'VPN', fill: '#b197fc', stroke: '#eee5ff' }
  },
  labelFields: ['name'],
  stylesheet: [
    {
      selector: 'node',
      style: {
        icon: 'router.generic',
        width: 82,
        height: 60,
        backgroundColor: '#6ea8fe',
        borderColor: '#d8e8ff',
        borderWidth: 4,
        zIndex: 10,
        draggable: true,
        selectable: true
      }
    },
    { selector: 'node[labels.vendor = "nokia"]', style: { icon: 'router.nokia' } },
    { selector: 'node[labels.vendor = "cisco"]', style: { icon: 'router.cisco' } },
    { selector: 'node[labels.vendor = "juniper"]', style: { icon: 'router.juniper' } },
    { selector: 'node[labels.node = "service"][labels.service = "l3vpn"]', style: { icon: 'service.l3vpn', width: 84, zIndex: 20 } },
    { selector: 'node[labels.scope = "aggregate"]', style: { width: 112, height: 52, labelFontSize: 10 } },
    { selector: 'link[labels.link = "physical"]', style: { label: 'Physical', curveStyle: 'straight', lineColor: '#6ea8fe', lineWidth: 2, targetArrowShape: 'none', opacity: 0.95 } },
    { selector: 'link[labels.protocol = "bgp-ls"]', style: { label: 'BGP-LS', curveStyle: 'taxi', lineColor: '#ffb454', lineWidth: 3, lineDashPattern: '3 6', targetArrowShape: 'triangle' } },
    { selector: 'link[labels.protocol = "pcep"]', style: { label: 'PCEP', curveStyle: 'unbundled-bezier', lineColor: '#ffd166', lineWidth: 3, lineDashPattern: '3 6', targetArrowShape: 'triangle' } },
    { selector: 'link[labels.link = "service"]', style: { label: 'Service overlay', curveStyle: 'bezier', lineColor: '#b197fc', lineWidth: 4, targetArrowShape: 'triangle' } },
    { selector: 'link[labels.role = "carrier"]', style: { label: 'SR-TE carrier', curveStyle: 'smooth-taxi', lineColor: '#ff6b9a', lineWidth: 1, pipe: true, pipeWidth: 22, pipeFill: '#ff6b9a', pipeBorderColor: '#ff6b9a', pipeOpacity: 0.16, targetArrowShape: 'none' } },
    { selector: 'link[parent = "transport-1321-carrier"]', style: { laneWidth: 4, laneGap: 6 } },
    { selector: 'path[labels.protocol = "sr-te"]', style: { label: 'Transport path', curveStyle: 'smooth-taxi', lineColor: '#ff6b9a', lineWidth: 6, targetArrowShape: 'triangle', animated: true, opacity: 0.96 } },
    { selector: 'path[labels.scope = "aggregate"]', style: { label: '1000 L3VPNs', lineColor: '#22c55e', lineWidth: 3, laneWidth: 7, laneGap: 9, lineDashPattern: '', targetArrowShape: 'triangle' } },
    { selector: 'region', style: { backgroundColor: 'rgba(76, 201, 240, 0.12)', borderColor: 'rgba(76, 201, 240, 0.62)', borderWidth: 1, zIndex: 2, selectable: true, draggable: true } },
    { selector: 'region[id = "isis-l1"]', style: { backgroundColor: 'rgba(66, 211, 146, 0.12)', borderColor: 'rgba(66, 211, 146, 0.62)' } },
    { selector: 'region[id = "as65000"]', style: { backgroundColor: 'rgba(255, 180, 84, 0.10)', borderColor: 'rgba(255, 180, 84, 0.56)', zIndex: 1 } }
  ]
};
