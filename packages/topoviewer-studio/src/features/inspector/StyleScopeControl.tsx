import { useEffect, useId, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { StyleTargetKind } from 'topoviewer';
import {
  styleSelectorIsValid,
  styleSelectorTarget,
  type StyleAuthoringRule,
  type StyleSelectorSuggestion
} from 'topoviewer/authoring';
import {
  StudioButton,
  StudioIconButton,
  StudioSelect,
  StudioTextField
} from '../../ui/controls';

const targetLabels: Record<StyleTargetKind, string> = {
  callout: 'Callout',
  link: 'Link',
  linkDirection: 'Link direction',
  node: 'Node',
  path: 'Path',
  region: 'Region',
  shape: 'Shape',
  text: 'Text'
};

interface StyleSelectorControlProps {
  activeRule?: StyleAuthoringRule;
  allRuleCount: number;
  creatingRule: boolean;
  matchIds: string[];
  onCancelCreate(): void;
  onCreateRule(selector: string): void;
  onDeleteRule(index: number): void;
  onDuplicateRule(index: number): void;
  onMoveRule(index: number, direction: -1 | 1): void;
  onRenameRule(index: number, selector: string): void;
  onSelectRule(index: number): void;
  onStartCreate(): void;
  selectorRules: StyleAuthoringRule[];
  suggestions: StyleSelectorSuggestion[];
  target: StyleTargetKind;
}

function matchSummary(ids: string[]) {
  if (!ids.length) return 'No current matches';
  const visible = ids.slice(0, 3).join(', ');
  return ids.length > 3 ? `${visible} +${ids.length - 3}` : visible;
}

export function styleTargetLabel(target: StyleTargetKind) {
  return targetLabels[target];
}

export function StyleSelectorControl({
  activeRule,
  allRuleCount,
  creatingRule,
  matchIds,
  onCancelCreate,
  onCreateRule,
  onDeleteRule,
  onDuplicateRule,
  onMoveRule,
  onRenameRule,
  onSelectRule,
  onStartCreate,
  selectorRules,
  suggestions,
  target
}: StyleSelectorControlProps) {
  const [selectorDraft, setSelectorDraft] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const menuId = `studio-selector-actions-${useId().replaceAll(':', '')}`;
  const activeSelector = activeRule?.rule.selector || '';

  useEffect(() => {
    setSelectorDraft(creatingRule
      ? suggestions.find((suggestion) => suggestion.source === 'label')?.selector
        || suggestions.find((suggestion) => suggestion.source === 'id')?.selector
        || target
      : activeSelector);
    setRenaming(false);
    setActionsOpen(false);
  }, [activeSelector, creatingRule, suggestions, target]);

  const selectorTargetMatches = styleSelectorTarget(selectorDraft) === target;
  const selectorValid = selectorTargetMatches && styleSelectorIsValid(selectorDraft);
  const canSave = Boolean(selectorDraft.trim()) && selectorValid;

  return (
    <section className="studio-style-policy" aria-label="Style selector policy">
      {creatingRule ? (
        <div className="studio-style-selector-create">
          <label>New selector
            <StudioTextField
              aria-label="New selector"
              autoFocus
              error={Boolean(selectorDraft.trim()) && !selectorValid}
              helperText={selectorDraft.trim() && !selectorValid ? `Enter a valid ${target} selector.` : undefined}
              onChange={(event) => setSelectorDraft(event.target.value)}
              value={selectorDraft}
            />
          </label>
          <div className="studio-selector-suggestions" aria-label="Selector suggestions">
            {suggestions.filter((suggestion) => suggestion.selector !== target).map((suggestion) => (
              <StudioButton
                aria-label={`Use selector ${suggestion.label}`}
                key={suggestion.selector}
                onClick={() => setSelectorDraft(suggestion.selector)}
                size="small"
                type="button"
              >{suggestion.label}</StudioButton>
            ))}
          </div>
          <div className="studio-style-selector-create-actions">
            <StudioButton onClick={onCancelCreate} type="button">Cancel</StudioButton>
            <StudioButton className="primary" disabled={!canSave || selectorDraft.trim() === target} onClick={() => onCreateRule(selectorDraft.trim())} type="button">Create selector</StudioButton>
          </div>
        </div>
      ) : (
        <>
          <div className="studio-style-selector-picker">
            <label>Selector
              <StudioSelect
                aria-label="Style selector"
                disabled={!selectorRules.length}
                onChange={(event) => onSelectRule(Number(event.target.value))}
                value={activeRule ? String(activeRule.index) : ''}
              >
                {!selectorRules.length ? <option value="">No specific selectors</option> : null}
                {selectorRules.map(({ index, rule }) => (
                  <option key={`${index}-${rule.selector}`} value={index}>{rule.selector}</option>
                ))}
              </StudioSelect>
            </label>
            <StudioIconButton aria-label="Add selector" onClick={onStartCreate} title="Add selector"><AddIcon fontSize="small" /></StudioIconButton>
            <div
              className="studio-selector-actions"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setActionsOpen(false);
              }}
            >
              <StudioIconButton
                aria-controls={actionsOpen ? menuId : undefined}
                aria-expanded={actionsOpen}
                aria-haspopup="menu"
                aria-label="Selector actions"
                disabled={!activeRule}
                onClick={() => setActionsOpen((value) => !value)}
                title="Selector actions"
              ><MoreVertIcon fontSize="small" /></StudioIconButton>
              {actionsOpen && activeRule ? <div className="studio-selector-action-menu" id={menuId} role="menu">
                <StudioButton onClick={() => { setRenaming(true); setActionsOpen(false); }} role="menuitem">Edit selector</StudioButton>
                <StudioButton disabled={activeRule.index === 0} onClick={() => { onMoveRule(activeRule.index, -1); setActionsOpen(false); }} role="menuitem">Move earlier</StudioButton>
                <StudioButton disabled={activeRule.index >= allRuleCount - 1} onClick={() => { onMoveRule(activeRule.index, 1); setActionsOpen(false); }} role="menuitem">Move later</StudioButton>
                <StudioButton onClick={() => { onDuplicateRule(activeRule.index); setActionsOpen(false); }} role="menuitem">Duplicate selector</StudioButton>
                <StudioButton color="error" onClick={() => { onDeleteRule(activeRule.index); setActionsOpen(false); }} role="menuitem">Delete selector</StudioButton>
              </div> : null}
            </div>
          </div>

          {renaming && activeRule ? <div className="studio-style-selector-rename">
            <StudioTextField
              aria-label="Selector expression"
              error={Boolean(selectorDraft.trim()) && !selectorValid}
              onChange={(event) => setSelectorDraft(event.target.value)}
              value={selectorDraft}
            />
            <StudioButton onClick={() => { setSelectorDraft(activeSelector); setRenaming(false); }} type="button">Cancel</StudioButton>
            <StudioButton
              className="primary"
              disabled={!canSave || selectorDraft.trim() === target}
              onClick={() => { onRenameRule(activeRule.index, selectorDraft.trim()); setRenaming(false); }}
              type="button"
            >Save</StudioButton>
          </div> : null}

          <div className="studio-style-selector-impact" aria-live="polite">
            <strong>{activeRule ? `${matchIds.length} match${matchIds.length === 1 ? '' : 'es'}` : 'Default only'}</strong>
            <span title={matchIds.join(', ')}>{activeRule ? matchSummary(matchIds) : `Add a specific ${targetLabels[target].toLocaleLowerCase()} selector when policy differs.`}</span>
          </div>
        </>
      )}
    </section>
  );
}
