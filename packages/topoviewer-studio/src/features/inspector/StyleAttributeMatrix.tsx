import { authoringFieldDefaultValue, type AuthoringFieldMetadata } from 'topoviewer/authoring';
import type { ReactElement, ReactNode } from 'react';
import { StudioButtonBase } from '../../ui/controls';

export type StudioStyleMatrixSource = 'default' | 'selector' | 'bypass';

interface StyleAttributeMatrixProps {
  activeFieldPath?: string;
  activeSource?: StudioStyleMatrixSource;
  bypassEnabled: boolean;
  bypassStyle: Record<string, unknown>;
  defaultStyle: Record<string, unknown>;
  fieldsByGroup: Map<string, AuthoringFieldMetadata[]>;
  onActivate(field: AuthoringFieldMetadata, source: StudioStyleMatrixSource): void;
  renderEditor(field: AuthoringFieldMetadata, source: StudioStyleMatrixSource): ReactNode;
  selectorEnabled: boolean;
  selectorStyle: Record<string, unknown>;
}

function displayValue(value: unknown): string {
  if (value === undefined) return '—';
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Empty';
  if (typeof value === 'object') return 'Configured';
  return String(value);
}

function StyleValue({ explicit, field, value }: { explicit: boolean; field: AuthoringFieldMetadata; value: unknown }) {
  const label = displayValue(value);
  return <span className="studio-style-matrix-value" data-explicit={explicit} title={label}>
    {field.valueType === 'color' && value !== undefined
      ? <span aria-hidden="true" className="studio-style-matrix-swatch" style={{ backgroundColor: String(value) }} />
      : null}
    <span>{label}</span>
  </span>;
}

export function StyleAttributeMatrix({
  activeFieldPath,
  activeSource,
  bypassEnabled,
  bypassStyle,
  defaultStyle,
  fieldsByGroup,
  onActivate,
  renderEditor,
  selectorEnabled,
  selectorStyle
}: StyleAttributeMatrixProps) {
  return (
    <table aria-label="Style attributes" className="studio-style-matrix">
      <colgroup>
        <col className="studio-style-matrix-source-column" />
        <col className="studio-style-matrix-source-column" />
        <col className="studio-style-matrix-source-column" />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Default</th>
          <th scope="col">Selector</th>
          <th scope="col">Bypass</th>
          <th scope="col">Style attribute</th>
        </tr>
      </thead>
      <tbody>
        {[...fieldsByGroup.entries()].flatMap(([group, fields]) => [
          <tr className="studio-style-matrix-group" key={`group-${group}`}>
            <th colSpan={4} scope="rowgroup">{group}</th>
          </tr>,
          ...fields.flatMap((field) => {
            const defaultExplicit = defaultStyle[field.path] !== undefined;
            const defaultValue = defaultStyle[field.path] ?? authoringFieldDefaultValue(field);
            const selectorExplicit = selectorStyle[field.path] !== undefined;
            const bypassExplicit = bypassStyle[field.path] !== undefined;
            const expanded = activeFieldPath === field.path && activeSource;
            return [
              <tr className="studio-style-matrix-row" data-style-attribute={field.path} key={field.path}>
                <td>
                  <StudioButtonBase
                    aria-label={`Edit Default ${field.label}`}
                    aria-pressed={expanded === 'default'}
                    className="studio-style-matrix-cell"
                    onClick={() => onActivate(field, 'default')}
                  ><StyleValue explicit={defaultExplicit} field={field} value={defaultValue} /></StudioButtonBase>
                </td>
                <td>
                  <StudioButtonBase
                    aria-label={`Edit Selector ${field.label}`}
                    aria-pressed={expanded === 'selector'}
                    className="studio-style-matrix-cell"
                    disabled={!selectorEnabled}
                    onClick={() => onActivate(field, 'selector')}
                  ><StyleValue explicit={selectorExplicit} field={field} value={selectorStyle[field.path]} /></StudioButtonBase>
                </td>
                <td>
                  <StudioButtonBase
                    aria-label={`Edit Bypass ${field.label}`}
                    aria-pressed={expanded === 'bypass'}
                    className="studio-style-matrix-cell"
                    disabled={!bypassEnabled}
                    onClick={() => onActivate(field, 'bypass')}
                  ><StyleValue explicit={bypassExplicit} field={field} value={bypassStyle[field.path]} /></StudioButtonBase>
                </td>
                <th scope="row" title={field.description}>
                  <strong>{field.label}</strong>
                  <small>{field.path}</small>
                </th>
              </tr>,
              expanded ? <tr className="studio-style-matrix-editor-row" key={`${field.path}-${expanded}`}>
                <td colSpan={4}>{renderEditor(field, expanded)}</td>
              </tr> : null
            ].filter((row): row is ReactElement => Boolean(row));
          })
        ])}
      </tbody>
    </table>
  );
}
