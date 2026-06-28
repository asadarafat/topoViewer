import type { MapperRule, TopoViewerMapper } from './mapperTypes';

export interface MapperPromQlStarter {
  id: string;
  label: string;
  query: string;
}

function selectorForMapper(mapper: TopoViewerMapper): string {
  const label = mapper.identity?.sourceIdLabel;
  const value = mapper.identity?.sourceId;
  if (!label || !value) return '';
  return `{${label}="${value}"}`;
}

function rateWindow(rule: MapperRule): string {
  return rule.metric.endsWith('_total') ? '[5m]' : '';
}

function starterQuery(rule: MapperRule, mapper: TopoViewerMapper): string {
  const selector = selectorForMapper(mapper);
  const window = rateWindow(rule);
  if (window) return `rate(${rule.metric}${selector}${window})`;
  return `${rule.metric}${selector}`;
}

export function starterPromQlForMapper(mapper: TopoViewerMapper | undefined): MapperPromQlStarter[] {
  if (!mapper?.mappings.length) return [];
  const seen = new Set<string>();
  return mapper.mappings.flatMap((rule) => {
    const query = starterQuery(rule, mapper);
    if (seen.has(query)) return [];
    seen.add(query);
    return [{
      id: rule.id,
      label: `${rule.id} (${rule.target.kind})`,
      query
    }];
  });
}
