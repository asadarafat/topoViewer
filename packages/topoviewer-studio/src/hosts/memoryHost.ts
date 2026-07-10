import type {
  StudioCreateProjectRequest,
  StudioDuplicateProjectRequest,
  StudioExportRequest,
  StudioHost,
  StudioHostEvent,
  StudioLoadResult,
  StudioProjectReference,
  StudioProjectSummary,
  StudioRenameProjectRequest,
  StudioResult,
  StudioSaveRequest,
  StudioSaveResult
} from '../contracts/host';
import type { StudioProject, StudioRecoverySnapshot } from '../contracts/project';
import { createStarterProject } from './starterProject';

function success<T>(value: T): StudioResult<T> {
  return { ok: true, value };
}

function denseProject(nodeCount = 120): StudioProject {
  const project = createStarterProject();
  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const column = index % 12;
    const row = Math.floor(index / 12);
    return [
      `    - id: dense-${index + 1}`,
      `      name: Dense ${index + 1}`,
      '      labels:',
      '        role: node',
      '      layers: [physical]',
      `      position: [${80 + column * 100}, ${80 + row * 84}]`
    ].join('\n');
  }).join('\n');
  const topology = project.documents.topology.text.replace('  nodes: []', `  nodes:\n${nodes}`);
  project.documents.topology = {
    ...project.documents.topology,
    contentHash: `dense-${nodeCount}-${topology.length}`,
    text: topology
  };
  project.id = 'studio-dense-project';
  project.name = `Dense topology (${nodeCount} nodes)`;
  return project;
}

function overlayProject(): StudioProject {
  const project = createStarterProject();
  const topology = [
    'toggles:',
    '  - id: showEdgeLabels',
    '    name: Edge labels',
    '    default: true',
    '  - id: physical-port',
    '    name: Physical ports',
    '    default: true',
    '  - id: bandwidth',
    '    name: Bandwidth',
    '    default: true',
    'graph:',
    '  id: studio-overlay-project',
    '  layers:',
    '    - id: physical',
    '      name: Physical',
    '  nodes:',
    '    - id: spine',
    '      name: Spine',
    '      layers: [physical]',
    '      position: [180, 260]',
    '    - id: leaf',
    '      name: Leaf',
    '      layers: [physical]',
    '      position: [620, 260]',
    '  links:',
    '    - id: spine-leaf',
    '      source: spine',
    '      target: leaf',
    '      sourceLabel: e1-1',
    '      targetLabel: e1-49',
    '      layers: [physical]',
    '      directions:',
    '        sourceToTarget:',
    '          label: 10 Gbps',
    '        targetToSource:',
    '          label: 6 Gbps',
    '  paths: []',
    '  regions: []',
    'diagram:',
    '  shapes: []',
    '  callouts: []',
    ''
  ].join('\n');
  const stylesheet = [
    'layout:',
    '  mode: manual',
    '  width: 960',
    '  height: 560',
    'stylesheet:',
    '  - selector: node',
    '    style:',
    '      shape: rectangle',
    '  - selector: link',
    '    style:',
    '      curveStyle: bezier',
    '      lineColor: "#64748b"',
    '      lineWidth: 3',
    '      directionalStrokes: true',
    '      endpointLabelOverlayLayer: physical-port',
    '      directionOverlayLayer: bandwidth',
    '      directionCenterGap: 56',
    '      directionLabelOffset: 22',
    '      targetArrowShape: triangle',
    ''
  ].join('\n');
  project.documents.topology = {
    ...project.documents.topology,
    contentHash: `overlay-topology-${topology.length}`,
    text: topology
  };
  project.documents.stylesheet = {
    ...project.documents.stylesheet,
    contentHash: `overlay-stylesheet-${stylesheet.length}`,
    text: stylesheet
  };
  project.id = 'studio-overlay-project';
  project.name = 'Overlay visibility';
  return project;
}

function futureStyleProject(): StudioProject {
  const project = createStarterProject();
  const topology = project.documents.topology.text.replace('  nodes: []', [
    '  nodes:',
    '    - id: future-node',
    '      name: Future Node',
    '      layers: [physical]',
    '      position: [240, 220]',
    '      style:',
    '        futureGlow:',
    '          mode: pulse',
    '          intensity: 0.8'
  ].join('\n'));
  project.documents.topology = {
    ...project.documents.topology,
    contentHash: `future-style-${topology.length}`,
    text: topology
  };
  project.id = 'studio-future-style-project';
  project.name = 'Future style compatibility';
  return project;
}

function futureMapperProject(): StudioProject {
  const project = createStarterProject();
  const mapper = [
    'version: 1',
    'mappings:',
    '  - id: node-health',
    '    metric: node_health',
    '    target:',
    '      kind: node',
    '      resolve:',
    '        by: id',
    '        metricLabel: node_id',
    '    value:',
    '      as: health',
    'x-future-transform:',
    '  normalize: clamp',
    ''
  ].join('\n');
  project.documents.mapper = {
    contentHash: `mapper-future-${mapper.length}`,
    kind: 'mapper',
    path: 'mapper.yaml',
    text: mapper
  };
  project.id = 'studio-future-mapper-project';
  project.name = 'Future mapper compatibility';
  return project;
}

function mapperCoverageProject(): StudioProject {
  const project = createStarterProject();
  const topology = project.documents.topology.text.replace('  nodes: []', [
    '  nodes:',
    '    - id: leaf1',
    '      name: Leaf 1',
    '      labels: { role: leaf }',
    '      layers: [physical]',
    '      position: [220, 220]',
    '    - id: leaf2',
    '      name: Leaf 2',
    '      labels: { role: leaf }',
    '      layers: [physical]',
    '      position: [520, 220]'
  ].join('\n'));
  const mapper = [
    'version: 1',
    'mappings:',
    '  - id: health-a',
    '    metric: health',
    '    target: { kind: node, resolve: { by: id, metricLabel: node_id } }',
    '  - id: health-b',
    '    metric: health',
    '    target: { kind: node, resolve: { by: id, metricLabel: node_id } }',
    '  - id: role',
    '    metric: role_health',
    '    target: { kind: node, resolve: { by: label, key: role, metricLabel: role } }',
    ''
  ].join('\n');
  project.documents.topology = { ...project.documents.topology, contentHash: `coverage-topology-${topology.length}`, text: topology };
  project.documents.mapper = { contentHash: `coverage-mapper-${mapper.length}`, kind: 'mapper', path: 'mapper.yaml', text: mapper };
  project.id = 'studio-mapper-coverage-project';
  project.name = 'Mapper coverage';
  return project;
}

export interface MemoryStudioHostOptions {
  fixture?: 'starter' | 'dense' | 'future-style' | 'mapper-coverage' | 'mapper-future' | 'overlay';
}

export class MemoryStudioHost implements StudioHost {
  readonly capabilities = { directoryProjects: false };
  readonly kind = 'browser' as const;
  private project: StudioProject;
  private projects = new Map<string, StudioProject>();
  private preferences = new Map<string, unknown>();

  constructor(options: MemoryStudioHostOptions = {}) {
    this.project = options.fixture === 'dense'
      ? denseProject()
      : options.fixture === 'mapper-coverage'
        ? mapperCoverageProject()
      : options.fixture === 'mapper-future'
        ? futureMapperProject()
      : options.fixture === 'future-style'
        ? futureStyleProject()
      : options.fixture === 'overlay'
        ? overlayProject()
        : createStarterProject();
    this.projects.set(this.project.id, structuredClone(this.project));
  }

  copyText(_text: string): Promise<StudioResult<void>> {
    return Promise.resolve(success(undefined));
  }

  createProject(request: StudioCreateProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    this.project = request.project
      ? structuredClone(request.project)
      : createStarterProject({ id: `memory-${crypto.randomUUID()}`, name: request.name });
    if (this.projects.has(this.project.id)) this.project.id = `memory-${crypto.randomUUID()}`;
    if (request.name?.trim()) this.project.name = request.name.trim();
    this.projects.set(this.project.id, structuredClone(this.project));
    return Promise.resolve(success({ project: structuredClone(this.project) }));
  }

  deleteProject(reference: StudioProjectReference): Promise<StudioResult<void>> {
    if (reference.id) this.projects.delete(reference.id);
    if (!this.projects.size) {
      this.project = createStarterProject({ id: `memory-${crypto.randomUUID()}` });
      this.projects.set(this.project.id, structuredClone(this.project));
    } else if (reference.id === this.project.id) {
      this.project = structuredClone(this.projects.values().next().value as StudioProject);
    }
    return Promise.resolve(success(undefined));
  }

  duplicateProject(request: StudioDuplicateProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    const source = this.projects.get(request.id);
    if (!source) return Promise.resolve({
      error: { code: 'not-found', message: `Project "${request.id}" does not exist.`, retryable: false },
      ok: false
    });
    this.project = structuredClone(source);
    this.project.id = `memory-${crypto.randomUUID()}`;
    this.project.name = request.name?.trim() || `${source.name} copy`;
    this.project.revision = 'memory-1';
    this.projects.set(this.project.id, structuredClone(this.project));
    return Promise.resolve(success({ project: structuredClone(this.project) }));
  }

  exportArtifact(_request: StudioExportRequest): Promise<StudioResult<void>> {
    return Promise.resolve(success(undefined));
  }

  listProjects(): Promise<StudioResult<StudioProjectSummary[]>> {
    return Promise.resolve(success([...this.projects.values()].map((project) => ({
      id: project.id,
      name: project.name,
      openedAt: project.metadata.updatedAt,
      revision: project.revision,
      updatedAt: project.metadata.updatedAt
    }))));
  }

  loadProject(reference?: StudioProjectReference): Promise<StudioResult<StudioLoadResult>> {
    if (reference?.id) {
      const project = this.projects.get(reference.id);
      if (!project) return Promise.resolve({
        error: { code: 'not-found', message: `Project "${reference.id}" does not exist.`, retryable: false },
        ok: false
      });
      this.project = structuredClone(project);
    }
    return Promise.resolve(success({ project: structuredClone(this.project) }));
  }

  readPreference<T>(key: string): Promise<StudioResult<T | undefined>> {
    return Promise.resolve(success(this.preferences.get(key) as T | undefined));
  }

  readProjectAssets(_reference: StudioProjectReference): Promise<StudioResult<[]>> {
    return Promise.resolve(success([]));
  }

  report(_event: StudioHostEvent): void {}

  renameProject(request: StudioRenameProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    const project = this.projects.get(request.id);
    if (!project) return Promise.resolve({
      error: { code: 'not-found', message: `Project "${request.id}" does not exist.`, retryable: false },
      ok: false
    });
    this.project = { ...structuredClone(project), name: request.name.trim() || project.name };
    this.projects.set(this.project.id, structuredClone(this.project));
    return Promise.resolve(success({ project: structuredClone(this.project) }));
  }

  saveRecovery(_snapshot: StudioRecoverySnapshot): Promise<StudioResult<void>> {
    return Promise.resolve(success(undefined));
  }

  saveProject(request: StudioSaveRequest): Promise<StudioResult<StudioSaveResult>> {
    const revision = `memory-${Number(this.project.revision.split('-').at(-1) || 0) + 1}`;
    this.project = structuredClone({ ...request.project, revision });
    this.projects.set(this.project.id, structuredClone(this.project));
    return Promise.resolve(success({ revision, savedAt: new Date().toISOString() }));
  }

  writePreference<T>(key: string, value: T): Promise<StudioResult<void>> {
    this.preferences.set(key, value);
    return Promise.resolve(success(undefined));
  }
}
