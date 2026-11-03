import { darkPalette, lightPalette } from "./palletes";
import { AUTHOR_TO_TEXT_GAP, TEXT_TO_MEDIA_GAP, MEDIA_TO_ENGAGEMENT_GAP, COMPACT_AVATAR_GAP, COMPACT_AVATAR_SIZE } from "../skia/layout";
import type { CardTemplate, CardElement, TweetType } from "../scene/types";


// Reproduces today's original hardcoded card exactly — this is the
// regression-parity check for the whole scene refactor.
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

// Same structure and gaps as Dark Classic, only the palette differs —
// this is the whole point of separating structure from color.
export const lightClassicTemplate: CardTemplate = {
  id: "light-classic",
  name: "Light Classic",
  appliesTo: ["original"],
  palette: lightPalette,
  elements: [
    { id: "author", type: "authorBlock", variant: "default" },
    { id: "body", type: "bodyText", variant: "default", gapBefore: AUTHOR_TO_TEXT_GAP },
    { id: "media", type: "media", variant: "default", gapBefore: TEXT_TO_MEDIA_GAP },
    { id: "engagement", type: "engagementRow", variant: "default", gapBefore: MEDIA_TO_ENGAGEMENT_GAP },
  ],
};

// Minimalist, centered, no media or metrics — for text-heavy quote-style
// tweets. Media/engagement elements are omitted entirely rather than set
// to visible: false, since this template never shows them regardless of
// what the tweet contains.
export const textOnlyQuoteTemplate: CardTemplate = {
  id: "text-only-quote",
  name: "Text-only Quote",
  appliesTo: ["original"],
  palette: darkPalette,
  elements: [
    { id: "author", type: "authorBlock", variant: "stacked" },
    { id: "body", type: "bodyText", variant: "quote", gapBefore: 40 },
  ],
};

// Same as Dark Classic minus the engagement row — a quick example of how
// cheap a new template is once the variants already exist: this one is
// just Dark Classic's element list with one line removed.
export const noEngagementTemplate: CardTemplate = {
  id: "no-engagement",
  name: "No Engagement",
  appliesTo: ["original"],
  palette: darkPalette,
  elements: [
    { id: "author", type: "authorBlock", variant: "default" },
    { id: "body", type: "bodyText", variant: "default", gapBefore: AUTHOR_TO_TEXT_GAP },
    { id: "media", type: "media", variant: "default", gapBefore: TEXT_TO_MEDIA_GAP },
  ],
};

export const minimalCompactTemplate: CardTemplate = {
  id: "minimal-compact",
  name: "Minimal Compact",
  appliesTo: ["original"],
  palette: lightPalette,
  elements: [
    { id: "author", type: "authorBlock", variant: "compact" },
    { id: "body", type: "bodyText", variant: "default", gapBefore: 24 },
    { id: "media", type: "media", variant: "framed", gapBefore: TEXT_TO_MEDIA_GAP },
    { id: "engagement", type: "engagementRow", variant: "minimal", gapBefore: MEDIA_TO_ENGAGEMENT_GAP },
  ],
};


// A quote version of any template: identical look, plus the embed before the engagement row.
function withQuoteEmbed(base: CardTemplate): CardTemplate {
  const embed: CardElement = {
    id: "quote", type: "quoteEmbed", variant: "default",
    dataBinding: "quotedTweet", gapBefore: TEXT_TO_MEDIA_GAP,
  };
  const engagementAt = base.elements.findIndex((e) => e.type === "engagementRow");
  const at = engagementAt === -1 ? base.elements.length : engagementAt;
  return {
    ...base,
    id: `${base.id}-quote`,
    appliesTo: ["quote"],
    elements: [...base.elements.slice(0, at), embed, ...base.elements.slice(at)],
  };
}

const AVATAR_COLUMN = COMPACT_AVATAR_SIZE + COMPACT_AVATAR_GAP;   // text starts beside the avatar

function conversationTemplate(id: string, name: string, palette: CardTemplate["palette"]): CardTemplate {
  return {
    id,
    name,
    appliesTo: ["thread", "reply"],
    palette,
    rail: true,
    elements: [
      { id: "author", type: "authorBlock", variant: "compact" },
      { id: "body", type: "bodyText", variant: "default", gapBefore: 16, inset: AVATAR_COLUMN },
      { id: "media", type: "media", variant: "default", gapBefore: TEXT_TO_MEDIA_GAP, inset: AVATAR_COLUMN },
      { id: "quote", type: "quoteEmbed", variant: "default", dataBinding: "quotedTweet", gapBefore: TEXT_TO_MEDIA_GAP, inset: AVATAR_COLUMN },
      { id: "engagement", type: "engagementRow", variant: "minimal", gapBefore: MEDIA_TO_ENGAGEMENT_GAP, inset: AVATAR_COLUMN },
    ],
  };
}

const conversationTemplates: CardTemplate[] = [
  conversationTemplate("dark-classic-thread", "Dark Conversation", darkPalette),
  conversationTemplate("light-classic-thread", "Light Conversation", lightPalette),
];

const singleTemplates: CardTemplate[] = [
  darkClassicTemplate,
  lightClassicTemplate,
  textOnlyQuoteTemplate,
  noEngagementTemplate,
  minimalCompactTemplate,
];



export function getTemplatesForShape(shape: TweetType): CardTemplate[] {
  const exact = cardTemplates.filter((t) => t.appliesTo.includes(shape));
  return exact.length > 0 ? exact : cardTemplates.filter((t) => t.appliesTo.includes("original"));
}


export function counterpartTemplate(current: CardTemplate, shape: TweetType): CardTemplate {
  const available = getTemplatesForShape(shape);
const baseId = current.id.replace(/-(quote|thread)$/, "");
return available.find((t) => t.id === baseId || t.id === `${baseId}-quote` || t.id === `${baseId}-thread`) ?? available[0];
}


export const cardTemplates: CardTemplate[] = [
  ...singleTemplates,
  ...singleTemplates.map(withQuoteEmbed),
  ...conversationTemplates,
];