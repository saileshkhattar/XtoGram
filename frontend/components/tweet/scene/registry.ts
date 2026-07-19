import type { ElementRegistry } from "./types";
import { AuthorBlockDefault } from "./variants/authorBlock/Default";
import { BodyTextDefault } from "./variants/bodyText/Default";
import { MediaDefault } from "./variants/media/Default";
import { EngagementRowDefault } from "./variants/engagementRow/Default";

// Registering a new variant is the entire integration step — add the file
// under scene/variants/<type>/, then one line here. SceneRenderer,
// CardTemplate, and the advanced editor's per-element picker (later) never
// need to change.
export const elementRegistry: ElementRegistry = {
  authorBlock: { default: AuthorBlockDefault },
  bodyText: { default: BodyTextDefault },
  media: { default: MediaDefault },
  engagementRow: { default: EngagementRowDefault },
};