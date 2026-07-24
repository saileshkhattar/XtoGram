import type { ElementType } from './types';

export type ElementBox = { x: number; y: number; width: number; height: number };

// These are editing limits, not layout defaults. They keep an element useful
// when a resize gesture turns a flow element into an explicitly positioned one.
export const MIN_ELEMENT_SIZE: Record<ElementType, { width: number; height: number }> = {
  authorBlock: { width: 380, height: 112 },
  bodyText: { width: 280, height: 80 },
  media: { width: 280, height: 180 },
  engagementRow: { width: 300, height: 40 },
};
