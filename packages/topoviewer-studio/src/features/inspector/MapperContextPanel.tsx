import { mapperRuleTargetKind, type MapperAuthoringTargetKind } from 'topoviewer/authoring';
import { parse } from 'yaml';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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
    <Box
      aria-labelledby="studio-inspector-mapper-tab"
      className="studio-inspector-mapper studio-inspector-document-panel"
      component="section"
      id="studio-inspector-mapper-panel"
      role="tabpanel"
    >
      <Paper className="studio-document-owner" variant="outlined">
        <Typography component="strong" variant="subtitle2">mapper.yaml</Typography>
        <Typography color="text.secondary" component="span" variant="caption">Telemetry rules targeting {target} objects</Typography>
      </Paper>
      {!mapper ? (
        <Stack className="studio-contextual-mapper-empty" spacing={0.5}>
          <Typography component="strong" variant="subtitle2">Telemetry mapper not enabled</Typography>
          <Typography color="text.secondary" variant="body2">The topology remains complete without runtime bindings.</Typography>
        </Stack>
      ) : (
        <Stack className="studio-contextual-mapper-rules" spacing={0.75}>
          <Typography component="strong" variant="subtitle2">{rules.length} matching rule{rules.length === 1 ? '' : 's'}</Typography>
          {rules.slice(0, 5).map((rule) => (
            <Paper className="studio-contextual-mapper-rule" key={rule.id} variant="outlined">
              <Typography component="span" variant="body2">{rule.metric}</Typography>
              <Typography component="code" variant="caption">{rule.id}</Typography>
            </Paper>
          ))}
          {!rules.length ? <Typography color="text.secondary" variant="body2">No mapper rule currently targets this object kind.</Typography> : null}
        </Stack>
      )}
      <StudioButton onClick={onOpenMapper} type="button">Edit mapper rules</StudioButton>
    </Box>
  );
}
