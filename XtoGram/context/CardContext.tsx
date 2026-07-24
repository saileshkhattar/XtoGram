// context/CardContext.tsx
//
// Single source of truth for "the card currently being built" — the tweet,
// the working template, and every quick-adjust value. Home screen preview,
// CardResult, EditSheet, and (soon) the Advanced Editor all read/write this
// instead of passing the same dozen props down through each other.
//
// Pattern deliberately mirrors AuthContext.tsx (createContext + Provider +
// a useX() hook that throws outside the provider) so the app only has one
// kind of global state mechanism, not two.
import { createContext, useContext, useState, ReactNode } from 'react';
import { darkClassicTemplate } from '../components/tweet/templates/definations';
import { PADDING } from '../components/tweet/skia/layout';
import { CARD_WIDTH } from '../components/tweet/skia/layout';
import { MIN_ELEMENT_SIZE } from '../components/tweet/scene/elementConstraints';
import { Colors } from '../constants/theme';
import type { CardTemplate, ElementPosition } from '../components/tweet/scene/types';
import type { Tweet } from '../types/tweet';

type CardContextType = {
  // The tweet currently loaded. Null before anything's been pasted/fetched.
  tweet: Tweet | null;
  setTweet: (tweet: Tweet | null) => void;

  // The active template. This is a *working copy* — picking a template
  // just points here at one of the shared objects from definitions.ts, but
  // every update below goes through setTemplate with a spread/copy, so the
  // original objects in the cardTemplates array are never mutated in place.
  template: CardTemplate;
  setTemplate: (template: CardTemplate) => void;

  // Quick-adjust values — same fields home.tsx already tracked locally,
  // just lifted here so every screen shares one copy.
  frameBackgroundColor: string;
  setFrameBackgroundColor: (color: string) => void;
  cardColorOverride?: string;
  setCardColorOverride: (color: string | undefined) => void;
  cardRadius: number;
  setCardRadius: (value: number) => void;
  cardPadding: number;
  setCardPadding: (value: number) => void;
  backgroundImageUri?: string;
  setBackgroundImageUri: (uri: string | undefined) => void;
  cardBackgroundImageUri?: string;
  setCardBackgroundImageUri: (uri: string | undefined) => void;
  backgroundImageBlur: number;
  setBackgroundImageBlur: (value: number) => void;
  cardBackgroundImageBlur: number;
  setCardBackgroundImageBlur: (value: number) => void;

  // Advanced Editor only — which element is currently tapped/selected.
  // Lives here (not local editor state) so it resets cleanly if the editor
  // unmounts and remounts, and so other pieces (e.g. a future property
  // panel rendered outside the canvas) can read it without prop drilling.
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;

  // Commits a dragged/resized element's final box into the template. This
  // also permanently takes that element out of flow layout — same rule
  // SceneRenderer already follows for any element with `position` set
  // (see scene/types.ts).
  updateElementPosition: (id: string, position: ElementPosition) => void;

  // Removes an element from the template entirely. Also clears selection
  // if the deleted element was the selected one, so the property panel
  // doesn't keep referencing an id that no longer exists.
  deleteElement: (id: string) => void;

  // Swaps which registered variant an element uses (e.g. authorBlock
  // "default" -> "compact"). The element keeps its id/position/gapBefore —
  // only its `variant` field changes, so an absolute-positioned element
  // stays in the same box and a flow element re-measures in place.
  setElementVariant: (id: string, variant: string) => void;
};

const CardContext = createContext<CardContextType | null>(null);

export function CardProvider({ children }: { children: ReactNode }) {
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [template, setTemplate] = useState<CardTemplate>(darkClassicTemplate);

  const [frameBackgroundColor, setFrameBackgroundColor] = useState(Colors.SURFACE);
  const [cardColorOverride, setCardColorOverride] = useState<string | undefined>(undefined);
  const [cardRadius, setCardRadius] = useState(0);
  const [cardPadding, setCardPadding] = useState(PADDING);
  const [backgroundImageUri, setBackgroundImageUri] = useState<string | undefined>();
  const [cardBackgroundImageUri, setCardBackgroundImageUri] = useState<string | undefined>();
  const [backgroundImageBlur, setBackgroundImageBlur] = useState(0);
  const [cardBackgroundImageBlur, setCardBackgroundImageBlur] = useState(0);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const updateElementPosition = (id: string, position: ElementPosition) => {
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => {
        if (el.id !== id) return el;
        const minimum = MIN_ELEMENT_SIZE[el.type];
        const width = Math.min(CARD_WIDTH, Math.max(minimum.width, position.width));
        const height = Math.max(minimum.height, position.height);
        const x = Math.min(Math.max(0, position.x), CARD_WIDTH - width);
        const y = Math.max(0, position.y);
        return { ...el, position: { x, y, width, height } };
      }),
    }));
  };

  const deleteElement = (id: string) => {
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    setSelectedElementId((current) => (current === id ? null : current));
  };

  const setElementVariant = (id: string, variant: string) => {
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, variant } : el)),
    }));
  };

  return (
    <CardContext.Provider
      value={{
        tweet,
        setTweet,
        template,
        setTemplate,
        frameBackgroundColor,
        setFrameBackgroundColor,
        cardColorOverride,
        setCardColorOverride,
        cardRadius,
        setCardRadius,
        cardPadding,
        setCardPadding,
        backgroundImageUri,
        setBackgroundImageUri,
        cardBackgroundImageUri,
        setCardBackgroundImageUri,
        backgroundImageBlur,
        setBackgroundImageBlur,
        cardBackgroundImageBlur,
        setCardBackgroundImageBlur,
        selectedElementId,
        setSelectedElementId,
        updateElementPosition,
        deleteElement,
        setElementVariant,
      }}
    >
      {children}
    </CardContext.Provider>
  );
}

export function useCard() {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error('useCard must be used inside CardProvider');
  return ctx;
}
