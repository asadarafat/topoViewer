import { useState } from 'react';
import { stringify } from 'yaml';
import {
  createBasicMapperRule,
  ingestMapperSamples,
  mapperRuleFromProposal,
  proposeMapperRule,
  styleAuthoringMetadataByTarget,
  type AuthoringObjectSelection,
  type CreateBasicMapperRuleOptions,
  type MapperRuleProposal
} from 'topoviewer/authoring';
import type { StudioCommand } from '../../contracts/commands';
import type {
  StudioMapperFieldEditRequest,
  StudioMapperFieldUnsetRequest,
  StudioMapperStyleEditRequest,
  StudioMapperStyleUnsetRequest
} from '../../contracts/mapper';
import type { StudioSelection } from '../../contracts/project';
import type { StudioDocumentSession } from '../../session';

interface StudioMapperCapabilityOptions {
  announce(message: string): void;
  execute(command: StudioCommand): boolean;
  session: StudioDocumentSession;
  setError(message?: string): void;
}

export function useStudioMapperCapability({ announce, execute, session, setError }: StudioMapperCapabilityOptions) {
  const [mapperSampleInput, setMapperSampleInputState] = useState<string>();
  const [mapperProposal, setMapperProposal] = useState<MapperRuleProposal>();

  function removeMapper() {
    if (!session.snapshot().project.documents.mapper) return true;
    return execute({
      id: 'remove-mapper',
      label: 'Remove telemetry mapper',
      execute: () => ({
        mutations: [{ document: 'mapper', kind: 'remove-document' }],
        summary: 'Removed telemetry mapper'
      })
    });
  }

  function createMapperRule(options: CreateBasicMapperRuleOptions) {
    const existingMapper = session.sourceValue('mapper');
    const mapper = existingMapper || { version: 1, rules: [] };
    try {
      const value = createBasicMapperRule(mapper, options);
      if (!existingMapper) {
        return execute({
          id: `create-mapper-with-rule-${value.id}`,
          label: `Create mapper rule ${value.id}`,
          execute: () => ({
            mutations: [
              {
                document: 'mapper',
                kind: 'create-document',
                path: 'mapper.yaml',
                text: stringify({ version: 1, rules: [value] })
              }
            ],
            summary: `Created mapper with rule ${value.id}`
          })
        });
      }
      const hasRules = Array.isArray(mapper.rules);
      return execute({
        id: `create-mapper-rule-${value.id}`,
        label: `Create mapper rule ${value.id}`,
        execute: () => ({
          mutations: [
            hasRules
              ? {
                  document: 'mapper',
                  kind: 'insert-value',
                  path: ['rules'],
                  value
                }
              : {
                  document: 'mapper',
                  kind: 'upsert-value',
                  path: ['rules'],
                  scopePath: [],
                  value: [value]
                }
          ],
          summary: `Created mapper rule ${value.id}`
        })
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      announce(`Mapper rule rejected: ${message}`);
      return false;
    }
  }

  function setMapperSampleInput(input: string) {
    setMapperSampleInputState(input);
    if (mapperProposal) setMapperProposal(undefined);
  }

  function proposeMapperMetric(metric: string, explicitSelection?: StudioSelection) {
    const current = session.snapshot();
    const selection = explicitSelection || current.selection[0];
    if (!selection) {
      setError('Select or drop onto a topology object before proposing a mapper rule.');
      return false;
    }
    if (!mapperSampleInput?.trim()) {
      setError('Load local telemetry samples before proposing a mapper rule.');
      return false;
    }
    const ingestion = ingestMapperSamples(mapperSampleInput);
    if (!ingestion.samples.length) {
      setError(ingestion.diagnostics.map((diagnostic) => diagnostic.message).join('; ') || 'No valid telemetry samples were loaded.');
      return false;
    }
    const proposal = proposeMapperRule(current.projection.document, ingestion.samples, metric, selection as AuthoringObjectSelection);
    setMapperProposal(proposal);
    setError(undefined);
    announce(`Proposed ${metric} for ${selection.kind} ${selection.id}`);
    return true;
  }

  function commitMapperProposal(candidateId?: string) {
    const mapper = session.sourceValue('mapper');
    if (!mapper || !mapperProposal) return false;
    try {
      const proposed = mapperRuleFromProposal(mapper, mapperProposal, candidateId);
      const collection = mapper[proposed.collection];
      const value = proposed.value as Record<string, unknown>;
      const created = execute({
        id: `create-inferred-mapper-${String(value.id || mapperProposal.metric)}`,
        label: `Create inferred mapper rule for ${mapperProposal.metric}`,
        execute: () => ({
          mutations: [
            Array.isArray(collection)
              ? {
                  document: 'mapper',
                  kind: 'insert-value',
                  path: [proposed.collection],
                  value
                }
              : {
                  document: 'mapper',
                  kind: 'upsert-value',
                  path: [proposed.collection],
                  scopePath: [],
                  value: [value]
                }
          ],
          summary: `Created inferred mapper rule for ${mapperProposal.metric}`
        })
      });
      if (created) setMapperProposal(undefined);
      return created;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      announce(`Mapper proposal rejected: ${message}`);
      return false;
    }
  }

  function commitMapperField(request: StudioMapperFieldEditRequest) {
    if (!session.snapshot().project.documents.mapper) return false;
    const existing = session.sourceRange('mapper', request.path);
    return execute({
      coalescingKey: `mapper:${request.path.join('.')}`,
      id: `mapper-field-${request.path.join('-')}`,
      label: `Edit mapper ${request.field.label}`,
      execute: () => ({
        mutations: [
          existing
            ? {
                document: 'mapper',
                kind: 'set-value',
                path: request.path,
                value: request.value
              }
            : {
                document: 'mapper',
                kind: 'upsert-value',
                path: request.path,
                scopePath: request.scopePath,
                value: request.value
              }
        ],
        summary: `Edited mapper ${request.field.label}`
      })
    });
  }

  function unsetMapperField(request: StudioMapperFieldUnsetRequest) {
    if (!session.sourceRange('mapper', request.path)) return false;
    return execute({
      id: `unset-mapper-${request.path.join('-')}`,
      label: `Unset mapper ${String(request.path.at(-1))}`,
      execute: () => ({
        mutations: [
          {
            document: 'mapper',
            kind: 'remove-value',
            path: request.path,
            scopePath: request.scopePath
          }
        ],
        summary: `Unset mapper ${String(request.path.at(-1))}`
      })
    });
  }

  function commitMapperStyle(request: StudioMapperStyleEditRequest) {
    const topLevelField = request.fieldPath[0];
    const compatible = styleAuthoringMetadataByTarget[request.target]?.some((field) => field.path === topLevelField);
    if (!compatible) {
      setError(`${topLevelField} is not compatible with ${request.target} mapper targets.`);
      announce(`Mapper style rejected: incompatible ${topLevelField}`);
      return false;
    }
    const existing = session.sourceRange('mapper', request.path);
    return execute({
      coalescingKey: `mapper-style:${request.path.join('.')}`,
      id: `mapper-style-${request.path.join('-')}`,
      label: `Edit mapper ${topLevelField} style`,
      execute: () => ({
        mutations: [
          existing
            ? {
                document: 'mapper',
                kind: 'set-value',
                path: request.path,
                value: request.value
              }
            : {
                document: 'mapper',
                kind: 'upsert-value',
                path: request.path,
                scopePath: request.scopePath,
                value: request.value
              }
        ],
        summary: `Edited mapper ${topLevelField} style`
      })
    });
  }

  return {
    commitMapperField,
    commitMapperProposal,
    commitMapperStyle,
    createMapperRule,
    mapperProposal,
    mapperSampleInput,
    proposeMapperMetric,
    removeMapper,
    setMapperSampleInput,
    unsetMapperField,
    unsetMapperStyle: unsetMapperField as (request: StudioMapperStyleUnsetRequest) => boolean
  };
}
