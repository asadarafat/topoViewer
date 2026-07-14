import { authoringFieldDefaultValue, type AuthoringFieldMetadata } from 'topoviewer/authoring';
import type { ReactElement, ReactNode } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { StudioButtonBase } from '../../ui/controls';

interface StyleAttributeMatrixProps {
  activeFieldPath?: string;
  effectiveStyle: Record<string, unknown>;
  fieldsByGroup: Map<string, AuthoringFieldMetadata[]>;
  objectStyle: Record<string, unknown>;
  onActivate(field: AuthoringFieldMetadata): void;
  renderEditor(field: AuthoringFieldMetadata, mode: 'detail' | 'inline'): ReactNode;
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
  return <Box className="studio-style-matrix-value" component="span" data-explicit={explicit} title={label}>
    {field.valueType === 'color' && value !== undefined
      ? <Box aria-hidden="true" className="studio-style-matrix-swatch" component="span" style={{ backgroundColor: String(value) }} />
      : null}
    <Typography component="span" variant="body2">{label}</Typography>
  </Box>;
}

export function StyleAttributeMatrix({
  activeFieldPath,
  effectiveStyle,
  fieldsByGroup,
  onActivate,
  objectStyle,
  renderEditor
}: StyleAttributeMatrixProps) {
  return (
    <TableContainer>
    <Table aria-label="Style attributes" className="studio-style-matrix" size="small">
      <TableHead>
        <TableRow>
          <TableCell component="th" scope="col">Attribute</TableCell>
          <TableCell className="studio-style-matrix-value-column" component="th" scope="col">Value</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[...fieldsByGroup.entries()].flatMap(([group, fields]) => [
          <TableRow className="studio-style-matrix-group" key={`group-${group}`}>
            <TableCell colSpan={2} component="th" scope="rowgroup">{group}</TableCell>
          </TableRow>,
          ...fields.flatMap((field) => {
            const explicit = objectStyle[field.path] !== undefined;
            const value = objectStyle[field.path]
              ?? effectiveStyle[field.path]
              ?? authoringFieldDefaultValue(field);
            const expanded = activeFieldPath === field.path;
            const nested = field.control?.kind === 'nested' && Boolean(field.nestedFields?.length);
            return [
              <TableRow className="studio-style-matrix-row" data-style-attribute={field.path} key={field.path}>
                <TableCell component="th" scope="row" title={`${field.label}: ${field.description}`}>
                  <Typography className="studio-style-matrix-attribute" component="code" variant="caption">{field.path}</Typography>
                </TableCell>
                <TableCell data-editor-active={expanded || undefined}>
                  {expanded && !nested
                    ? <Box className="studio-style-matrix-inline-editor">{renderEditor(field, 'inline')}</Box>
                    : <StudioButtonBase
                        aria-label={`Edit This object ${field.label}`}
                        aria-pressed={expanded}
                        className="studio-style-matrix-cell"
                        onClick={() => onActivate(field)}
                      ><StyleValue explicit={explicit} field={field} value={value} /></StudioButtonBase>}
                </TableCell>
              </TableRow>,
              expanded && nested ? <TableRow className="studio-style-matrix-editor-row" key={`${field.path}-${expanded}`}>
                <TableCell colSpan={2}>{renderEditor(field, 'detail')}</TableCell>
              </TableRow> : null
            ].filter((row): row is ReactElement => Boolean(row));
          })
        ])}
      </TableBody>
    </Table>
    </TableContainer>
  );
}
