import { mapperRuleTargetKind, type MapperAuthoringTargetKind } from 'topoviewer/authoring';
import { parse } from 'yaml';
import type { StudioSessionSnapshot } from '../../contracts/project';
import { StudioButton } from '../../ui/controls';

interface MapperContextPanelProps {
  onOpenMapper(): void;
  snapshot: StudioSessionSnapshot;
  target: MapperAuthoringTargetKind;
}

interface MapperRuleSummary {
  id: string;
  metric: string;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function contextualRules(text: string, target: MapperAuthoringTargetKind): MapperRuleSummary[] {
  try {
    const mapper = record(parse(text));
    if (!mapper) return [];
    return ['rules', 'mappings'].flatMap((collection) => (
      Array.isArray(mapper[collection])
        ? (mapper[collection] as unknown[]).flatMap((candidate, index) => {
            const rule = record(candidate);
            if (!rule || mapperRuleTargetKind(rule) !== target) return [];
            return [{
              id: String(rule.id || `${collection}-${index + 1}`),
              metric: String(rule.metric || 'Metric not set')
            }];
          })
        : []
    ));
  } catch {
    return [];
  }
}

export function MapperContextPanel({ onOpenMapper, snapshot, target }: MapperContextPanelProps) {
  const mapper = snapshot.project.documents.mapper;
  const rules = mapper ? contextualRules(mapper.text, target) : [];
  return (
    <section
      aria-labelledby="studio-inspector-mapper-tab"
      className="studio-inspector-mapper studio-inspector-document-panel"
      id="studio-inspector-mapper-panel"
      role="tabpanel"
    >
      <div className="studio-document-owner">
        <strong>mapper.yaml</strong>
        <span>Telemetry rules targeting {target} objects</span>
      </div>
      {!mapper ? (
        <div className="studio-contextual-mapper-empty">
          <strong>Telemetry mapper not enabled</strong>
          <span>The topology remains complete without runtime bindings.</span>
        </div>
      ) : (
        <div className="studio-contextual-mapper-rules">
          <strong>{rules.length} matching rule{rules.length === 1 ? '' : 's'}</strong>
          {rules.slice(0, 5).map((rule) => (
            <div className="studio-contextual-mapper-rule" key={rule.id}>
              <span>{rule.metric}</span>
              <code>{rule.id}</code>
            </div>
          ))}
          {!rules.length ? <span>No mapper rule currently targets this object kind.</span> : null}
        </div>
      )}
      <StudioButton onClick={onOpenMapper} type="button">Edit mapper rules</StudioButton>
    </section>
  );
}
