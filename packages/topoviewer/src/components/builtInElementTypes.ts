import { CalloutNode } from './CalloutNode';
import { FloatingEdge } from './FloatingEdge';
import { NetworkNode } from './NetworkNode';
import { PinNode } from './PinNode';
import { RegionNode } from './RegionNode';
import { ShapeNode } from './ShapeNode';
import { TextNode } from './TextNode';

export const builtInNodeTypes = {
  callout: CalloutNode,
  network: NetworkNode,
  pin: PinNode,
  region: RegionNode,
  shape: ShapeNode,
  text: TextNode
};

export const builtInEdgeTypes = { floating: FloatingEdge };
