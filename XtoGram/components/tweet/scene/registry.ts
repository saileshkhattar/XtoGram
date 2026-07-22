import type { ElementRegistry } from "./types";

import { AuthorBlockDefault } from "./variants/authorBlock/Default";
import { AuthorBlockCompact } from "./variants/authorBlock/Compact";
import { AuthorBlockStacked } from "./variants/authorBlock/Stacked";

import { BodyTextDefault } from "./variants/bodyText/Default";
import { BodyTextQuote } from "./variants/bodyText/Quote";

import { MediaDefault } from "./variants/media/Default";
import { MediaFramed } from "./variants/media/Framed";
import { MediaFullBleed } from "./variants/media/FullBleed";
import { MediaCropped } from "./variants/media/Cropped";

import { EngagementRowDefault } from "./variants/engagementRow/Default";
import { EngagementRowMinimal } from "./variants/engagementRow/Minimal";
import { EngagementRowIconsOnly } from "./variants/engagementRow/IconsOnly";

// Registering a new variant is the entire integration step — add the file
// under scene/variants/<type>/, then one line here. SceneRenderer,
// CardTemplate, and the advanced editor's per-element picker (later) never
// need to change.
export const elementRegistry: ElementRegistry = {
  authorBlock: {
    default: AuthorBlockDefault,
    compact: AuthorBlockCompact,
    stacked: AuthorBlockStacked,
  },
  bodyText: {
    default: BodyTextDefault,
    quote: BodyTextQuote,
  },
  media: {
    default: MediaDefault,
    framed: MediaFramed,
    fullBleed: MediaFullBleed,
    cropped: MediaCropped,
  },
  engagementRow: {
    default: EngagementRowDefault,
    minimal: EngagementRowMinimal,
    iconsOnly: EngagementRowIconsOnly,
  },
};