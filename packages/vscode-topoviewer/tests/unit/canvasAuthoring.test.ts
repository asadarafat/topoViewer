import { describe, expect, it } from 'vitest';
import {
  canRunCanvasMutation,
  clientPointToTopologyPoint,
  defaultCanvasAuthoringState,
  isCanvasMutatingTool,
  isNodePresetTool,
  layersForCanvasCreation,
  reduceCanvasAuthoringState,
  snapTopologyPoint,
  type CanvasAuthoringTool
} from '../../src/webview/canvasAuthoring';

describe('canvas authoring tools', () => {
  it('classifies topology mutation tools separately from select and pan', () => {
    expect(isCanvasMutatingTool('select')).toBe(false);
    expect(isCanvasMutatingTool('pan')).toBe(false);
    expect(isCanvasMutatingTool('router')).toBe(true);
    expect(isCanvasMutatingTool('link')).toBe(true);
    expect(isCanvasMutatingTool('shape')).toBe(true);
  });

  it('classifies node preset tools', () => {
    const presetTools: CanvasAuthoringTool[] = ['node', 'router', 'service', 'controller', 'external'];
    const nonPresetTools: CanvasAuthoringTool[] = ['select', 'pan', 'link', 'path', 'region', 'callout', 'shape', 'text'];

    expect(presetTools.every(isNodePresetTool)).toBe(true);
    expect(nonPresetTools.some(isNodePresetTool)).toBe(false);
  });

  it('resets one-shot tools after completion and keeps sticky tools active', () => {
    const oneShot = reduceCanvasAuthoringState(defaultCanvasAuthoringState, {
      tool: 'router',
      type: 'selectTool'
    });
    expect(oneShot).toEqual({ activeTool: 'router', sticky: false });
    expect(reduceCanvasAuthoringState(oneShot, { type: 'completeAction' })).toEqual(defaultCanvasAuthoringState);

    const sticky = reduceCanvasAuthoringState(defaultCanvasAuthoringState, {
      sticky: true,
      tool: 'service',
      type: 'selectTool'
    });
    expect(reduceCanvasAuthoringState(sticky, { type: 'completeAction' })).toEqual(sticky);
  });

  it('cancels active tool state back to select', () => {
    const state = reduceCanvasAuthoringState(defaultCanvasAuthoringState, {
      sticky: true,
      tool: 'link',
      type: 'selectTool'
    });

    expect(reduceCanvasAuthoringState(state, { type: 'cancel' })).toEqual(defaultCanvasAuthoringState);
  });

  it('blocks mutating canvas tools while YAML draft is dirty', () => {
    expect(canRunCanvasMutation('select', true)).toBe(true);
    expect(canRunCanvasMutation('pan', true)).toBe(true);
    expect(canRunCanvasMutation('router', true)).toBe(false);
    expect(canRunCanvasMutation('link', true)).toBe(false);
    expect(canRunCanvasMutation('router', false)).toBe(true);
  });
});

describe('canvas authoring coordinates', () => {
  it('converts browser client coordinates into topology coordinates', () => {
    expect(clientPointToTopologyPoint(
      { x: 250, y: 140 },
      { left: 50, top: 40 },
      { x: -100, y: -60, zoom: 2 }
    )).toEqual({ x: 150, y: 80 });
  });

  it('falls back to zoom 1 for invalid viewport zoom', () => {
    expect(clientPointToTopologyPoint(
      { x: 140, y: 90 },
      { left: 40, top: 20 },
      { x: 10, y: -10, zoom: 0 }
    )).toEqual({ x: 90, y: 80 });
  });

  it('snaps topology coordinates to grid when requested', () => {
    expect(snapTopologyPoint({ x: 143, y: 87 }, 20)).toEqual({ x: 140, y: 80 });
    expect(snapTopologyPoint({ x: 143, y: 87 })).toEqual({ x: 143, y: 87 });
  });

  it('uses selected layers for creation with a deterministic fallback', () => {
    expect(layersForCanvasCreation(['service', ''], 'physical')).toEqual(['service']);
    expect(layersForCanvasCreation([], 'physical')).toEqual(['physical']);
  });
});

