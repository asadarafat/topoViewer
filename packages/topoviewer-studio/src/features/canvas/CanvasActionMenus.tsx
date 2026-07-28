import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AlignHorizontalCenterOutlinedIcon from '@mui/icons-material/AlignHorizontalCenterOutlined';
import AlignHorizontalLeftOutlinedIcon from '@mui/icons-material/AlignHorizontalLeftOutlined';
import AlignHorizontalRightOutlinedIcon from '@mui/icons-material/AlignHorizontalRightOutlined';
import AlignVerticalBottomOutlinedIcon from '@mui/icons-material/AlignVerticalBottomOutlined';
import AlignVerticalCenterOutlinedIcon from '@mui/icons-material/AlignVerticalCenterOutlined';
import AlignVerticalTopOutlinedIcon from '@mui/icons-material/AlignVerticalTopOutlined';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import FormatPaintOutlinedIcon from '@mui/icons-material/FormatPaintOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHorizOutlined';
import SwapVertIcon from '@mui/icons-material/SwapVertOutlined';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import type { TopoViewerProps } from 'topoviewer';
import type { AuthoringAlignment, AuthoringDistributionAxis } from 'topoviewer/authoring';
import type { StudioSelection } from '../../contracts/project';
import {
  StudioMenu,
  StudioMenuDivider,
  StudioMenuItem,
  StudioMenuItemIcon,
  StudioMenuItemText
} from '../../ui/controls';
import { QuickTextEditor, type QuickTextEditorState } from './QuickTextEditor';

export interface CanvasContextMenuState {
  objectId: string;
  scope: 'object' | 'selection';
  x: number;
  y: number;
}

export interface CanvasAlignmentMenuState {
  anchor: HTMLElement;
  source: 'context' | 'toolbar';
}

interface CanvasActionMenusProps {
  alignSelection(alignment: AuthoringAlignment): boolean;
  alignmentMenu?: CanvasAlignmentMenuState;
  canCopy: boolean;
  canCopyFormat: boolean;
  canSaveSelectionAsPreset: boolean;
  closeContextMenu(): void;
  closeQuickEditor(): void;
  commitObjectText(selection: StudioSelection, value: string): boolean;
  contextMenu?: CanvasContextMenuState;
  contextRegionId?: string;
  contextSelection?: StudioSelection;
  contextSelectionCount: number;
  createNestedRegion(parentId: string): boolean;
  deleteSelection(): boolean;
  distributeSelection(axis: AuthoringDistributionAxis): boolean;
  duplicateSelection(): boolean;
  formatPainterActive: boolean;
  positionedSelectionCount: number;
  quickEditor?: QuickTextEditorState;
  releaseNodeFromRegion(nodeId: string, regionId?: string): boolean;
  saveSelectionAsPreset(): boolean;
  setAlignmentMenu(value?: CanvasAlignmentMenuState): void;
  setRegionExpanded(change: Parameters<NonNullable<TopoViewerProps['onRegionAggregateToggle']>>[0]): boolean;
  toggleFormatPainter(): void;
}

const alignmentActions = [
  { alignment: 'left', Icon: AlignHorizontalLeftOutlinedIcon, label: 'Align left' },
  { alignment: 'center', Icon: AlignHorizontalCenterOutlinedIcon, label: 'Align horizontal center' },
  { alignment: 'right', Icon: AlignHorizontalRightOutlinedIcon, label: 'Align right' },
  { alignment: 'top', Icon: AlignVerticalTopOutlinedIcon, label: 'Align top' },
  { alignment: 'middle', Icon: AlignVerticalCenterOutlinedIcon, label: 'Align vertical center' },
  { alignment: 'bottom', Icon: AlignVerticalBottomOutlinedIcon, label: 'Align bottom' }
] satisfies Array<{ alignment: AuthoringAlignment; Icon: typeof AlignHorizontalLeftOutlinedIcon; label: string }>;

export function CanvasActionMenus({
  alignSelection,
  alignmentMenu,
  canCopy,
  canCopyFormat,
  canSaveSelectionAsPreset,
  closeContextMenu,
  closeQuickEditor,
  commitObjectText,
  contextMenu,
  contextRegionId,
  contextSelection,
  contextSelectionCount,
  createNestedRegion,
  deleteSelection,
  distributeSelection,
  duplicateSelection,
  formatPainterActive,
  positionedSelectionCount,
  quickEditor,
  releaseNodeFromRegion,
  saveSelectionAsPreset,
  setAlignmentMenu,
  setRegionExpanded,
  toggleFormatPainter
}: CanvasActionMenusProps) {
  function runAlignmentCommand(command: () => void) {
    const openedFromContext = alignmentMenu?.source === 'context';
    command();
    setAlignmentMenu(undefined);
    if (openedFromContext) closeContextMenu();
  }

  function openAlignmentMenu(anchor: HTMLElement, source: CanvasAlignmentMenuState['source']) {
    setAlignmentMenu({ anchor, source });
  }

  return (
    <>
      <StudioMenu
        anchorEl={alignmentMenu?.anchor}
        anchorOrigin={alignmentMenu?.source === 'context' ? { horizontal: 'right', vertical: 'top' } : undefined}
        onClose={() => setAlignmentMenu(undefined)}
        onKeyDown={(event) => {
          if (alignmentMenu?.source !== 'context' || event.key !== 'ArrowLeft') return;
          event.preventDefault();
          const anchor = alignmentMenu.anchor;
          setAlignmentMenu(undefined);
          queueMicrotask(() => anchor.focus());
        }}
        open={Boolean(alignmentMenu)}
        slotProps={{ list: { 'aria-label': 'Align and distribute selection', dense: true } }}
        transformOrigin={alignmentMenu?.source === 'context' ? { horizontal: 'left', vertical: 'top' } : undefined}
      >
        {alignmentActions.map(({ alignment, Icon, label }) => (
          <StudioMenuItem key={alignment} onClick={() => runAlignmentCommand(() => alignSelection(alignment))}>
            <StudioMenuItemIcon><Icon fontSize="small" /></StudioMenuItemIcon>
            <StudioMenuItemText>{label}</StudioMenuItemText>
          </StudioMenuItem>
        ))}
        {positionedSelectionCount >= 3 ? <StudioMenuDivider /> : null}
        {positionedSelectionCount >= 3 ? (
          <StudioMenuItem onClick={() => runAlignmentCommand(() => distributeSelection('horizontal'))}>
            <StudioMenuItemIcon><SwapHorizIcon fontSize="small" /></StudioMenuItemIcon>
            <StudioMenuItemText>Distribute horizontally</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
        {positionedSelectionCount >= 3 ? (
          <StudioMenuItem onClick={() => runAlignmentCommand(() => distributeSelection('vertical'))}>
            <StudioMenuItemIcon><SwapVertIcon fontSize="small" /></StudioMenuItemIcon>
            <StudioMenuItemText>Distribute vertically</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
      </StudioMenu>

      <StudioMenu
        anchorPosition={contextMenu ? { left: contextMenu.x, top: contextMenu.y } : undefined}
        anchorReference="anchorPosition"
        disableRestoreFocus
        onClose={closeContextMenu}
        open={Boolean(contextMenu)}
        slotProps={{
          list: { 'aria-label': 'Selection actions', dense: true },
          paper: { sx: { minWidth: 216 } }
        }}
      >
        <StudioMenuItem
          disabled={!canCopy}
          onClick={() => {
            duplicateSelection();
            closeContextMenu();
          }}
        >
          <StudioMenuItemIcon><ContentCopyOutlinedIcon fontSize="small" /></StudioMenuItemIcon>
          <StudioMenuItemText>{contextSelectionCount > 1 ? `Duplicate ${contextSelectionCount} objects` : 'Duplicate'}</StudioMenuItemText>
        </StudioMenuItem>
        {canCopyFormat ? (
          <StudioMenuItem
            aria-pressed={formatPainterActive}
            onClick={() => {
              toggleFormatPainter();
              closeContextMenu();
            }}
          >
            <StudioMenuItemIcon><FormatPaintOutlinedIcon fontSize="small" /></StudioMenuItemIcon>
            <StudioMenuItemText>{formatPainterActive ? 'Cancel format painter' : 'Copy formatting'}</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
        {canSaveSelectionAsPreset ? (
          <StudioMenuItem
            onClick={() => {
              saveSelectionAsPreset();
              closeContextMenu();
            }}
          >
            <StudioMenuItemIcon><BookmarkAddOutlinedIcon fontSize="small" /></StudioMenuItemIcon>
            <StudioMenuItemText>Save to Object Palette</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
        {contextMenu?.scope === 'selection' && positionedSelectionCount >= 2 ? (
          <StudioMenuItem
            aria-expanded={alignmentMenu?.source === 'context'}
            aria-haspopup="menu"
            onClick={(event) => openAlignmentMenu(event.currentTarget, 'context')}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight') return;
              event.preventDefault();
              openAlignmentMenu(event.currentTarget, 'context');
            }}
          >
            <StudioMenuItemIcon><AlignHorizontalLeftOutlinedIcon fontSize="small" /></StudioMenuItemIcon>
            <StudioMenuItemText>Align and distribute</StudioMenuItemText>
            <ChevronRightOutlinedIcon color="action" fontSize="small" />
          </StudioMenuItem>
        ) : null}
        {contextSelection?.kind === 'node' && contextRegionId ? (
          <StudioMenuItem
            onClick={() => {
              releaseNodeFromRegion(contextSelection.id, contextRegionId);
              closeContextMenu();
            }}
          >
            <StudioMenuItemIcon><DriveFileMoveOutlinedIcon fontSize="small" /></StudioMenuItemIcon>
            <StudioMenuItemText>Release from region</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
        {contextSelection?.kind === 'region' ? (
          <>
            <StudioMenuItem
              onClick={() => {
                createNestedRegion(contextSelection.id);
                closeContextMenu();
              }}
            >
              <StudioMenuItemIcon><AccountTreeOutlinedIcon fontSize="small" /></StudioMenuItemIcon>
              <StudioMenuItemText>Create nested region</StudioMenuItemText>
            </StudioMenuItem>
            <StudioMenuItem
              onClick={() => {
                setRegionExpanded({
                  data: {},
                  expanded: false,
                  groupId: `summary-${contextSelection.id}`,
                  regionId: contextSelection.id
                });
                closeContextMenu();
              }}
            >
              <StudioMenuItemIcon><UnfoldLessIcon fontSize="small" /></StudioMenuItemIcon>
              <StudioMenuItemText>Collapse region</StudioMenuItemText>
            </StudioMenuItem>
          </>
        ) : null}
        <StudioMenuDivider />
        <StudioMenuItem
          disabled={!canCopy}
          onClick={() => {
            deleteSelection();
            closeContextMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <StudioMenuItemIcon sx={{ color: 'inherit' }}><DeleteOutlineIcon fontSize="small" /></StudioMenuItemIcon>
          <StudioMenuItemText>{contextSelectionCount > 1 ? `Delete ${contextSelectionCount} objects` : 'Delete'}</StudioMenuItemText>
        </StudioMenuItem>
      </StudioMenu>

      <QuickTextEditor
        onCancel={closeQuickEditor}
        onSave={(value) => {
          if (quickEditor && commitObjectText(quickEditor.selection, value)) closeQuickEditor();
        }}
        target={quickEditor}
      />
    </>
  );
}

export default CanvasActionMenus;
