import type { CardTemplate } from "../scene/types";
import { darkPalette } from "./palletes";
import { AUTHOR_TO_TEXT_GAP, TEXT_TO_MEDIA_GAP, MEDIA_TO_ENGAGEMENT_GAP } from "../skia/layout";

// Reproduces today's hardcoded RegularCard.tsx exactly: same palette
// values, same variants, same gaps — this is the regression-parity check
// for the whole scene refactor. If this doesn't look pixel-identical to
// the old card, something in SceneRenderer or a variant is wrong.
export const darkClassicTemplate: CardTemplate = {
  id: "dark-classic",
  name: "Dark Classic",
  appliesTo: ["original"],
  palette: darkPalette,
  elements: [
    { id: "author", type: "authorBlock", variant: "default" },
    { id: "body", type: "bodyText", variant: "default", gapBefore: AUTHOR_TO_TEXT_GAP },
    { id: "media", type: "media", variant: "default", gapBefore: TEXT_TO_MEDIA_GAP },
    { id: "engagement", type: "engagementRow", variant: "default", gapBefore: MEDIA_TO_ENGAGEMENT_GAP },
  ],
};

// The rest of the initial 5 (Light Classic, Text-only Quote, No
// Engagement, Minimal Compact) get added here in step 3, once their
// variants exist.
export const cardTemplates: CardTemplate[] = [darkClassicTemplate];