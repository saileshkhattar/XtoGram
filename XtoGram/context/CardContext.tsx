import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { darkClassicTemplate } from '../components/tweet/templates/definations';
import { PADDING } from '../components/tweet/skia/layout';
import { CARD_WIDTH } from '../components/tweet/skia/layout';
import { MIN_ELEMENT_SIZE } from '../components/tweet/scene/elementConstraints';
import { Colors } from '../constants/theme';
import type { CardTemplate, ElementPosition } from '../components/tweet/scene/types';
import { trimQuoteDepth, getShape } from '../utils/conversation';
import type { ConversationResponse, Tweet } from '../types/tweet';
import { getTemplatesForShape, counterpartTemplate } from '../components/tweet/templates/definations';
import { TweetType } from '../components/tweet/scene/types';
import { useTweetFonts } from '../components/tweet/skia/fonts';
import { planPages, type Page, type PagePlan } from '../components/tweet/scene/plan';
import { clearImageCache } from '../components/tweet/skia/imageCache';
import { applyOverrides, type Overrides, type TweetOverride } from '../utils/conversation';
import { frameColorFor } from '../utils/colors';




type CardContextType = {
  tweet: Tweet | null;
  conversation: ConversationResponse | null;
  setConversation: (c: ConversationResponse | null) => void;
  selection: { start: number; end: number; quoteDepth: number } | null;
  setSelection: (s: { start: number; end: number; quoteDepth: number }) => void;
  visibleNodes: Tweet[];
  template: CardTemplate;
  setTemplate: (template: CardTemplate) => void;
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
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  updateElementPosition: (id: string, position: ElementPosition) => void;
  deleteElement: (id: string) => void;
  setElementVariant: (id: string, variant: string) => void;
  shape: TweetType;
  isMulti: boolean;                       
  plan: PagePlan | null;
  pages: Page[];                          
  layoutChoice: 'auto' | 'one' | 'series';
  setLayoutChoice: (c: 'auto' | 'one' | 'series') => void;
  pageColor?: string;                     
  frameEnabled: boolean; 
  setFrameEnabled: (v: boolean) => void
  overrides: Overrides;
  setOverride: (id: string, o: TweetOverride) => void;
  resetOverride: (id: string) => void;
};

const CardContext = createContext<CardContextType | null>(null);

export function CardProvider({ children }: { children: ReactNode }) {
const [conversation, setConversationState] = useState<ConversationResponse | null>(null);
const [layoutChoice, setLayoutChoice] = useState<'auto' | 'one' | 'series'>('auto');
const [selection, setSelection] = useState<{ start: number; end: number; quoteDepth: number } | null>(null);

const [overrides, setOverrides] = useState<Overrides>({});


const setOverride = (id: string, o: TweetOverride) => setOverrides((prev) => ({ ...prev, [id]: o }));
const resetOverride = (id: string) =>
  setOverrides((prev) => { const { [id]: _removed, ...rest } = prev; return rest; });



const setConversation = (c: ConversationResponse | null) => {
  clearImageCache();
  setOverrides({});
  setConversationState(c);
  setLayoutChoice('auto');
  // Default selection: the server's suggested range, level-1 quote only (tier permitting).
  setSelection(c ? { ...c.defaultRange, quoteDepth: Math.min(1, c.limits.quoteDepth) } : null);
};

  const visibleNodes = useMemo(() => {
    if (!conversation || !selection) return [];
    return conversation.nodes
      .slice(selection.start, selection.end + 1)
      .map((n) => trimQuoteDepth(applyOverrides(n, overrides), selection.quoteDepth));
  }, [conversation, selection, overrides]);

// Until the pager exists (later steps), every card still renders the pasted tweet only.
  const tweet = useMemo<Tweet | null>(() => {
    if (!conversation || !selection) return null;
   return trimQuoteDepth(applyOverrides(conversation.nodes[conversation.focusIndex], overrides), selection.quoteDepth);
  }, [conversation, selection, overrides]);

  const shape = useMemo(() => getShape(visibleNodes), [visibleNodes]);



  const [template, setTemplate] = useState<CardTemplate>(darkClassicTemplate);

  useEffect(() => {
    if (!conversation) return;
    if (getTemplatesForShape(shape).some((t) => t.id === template.id)) return;
    setTemplate(counterpartTemplate(template, shape));
  }, [conversation, shape, template.id]);

  const [frameColorOverride, setFrameColorOverride] = useState<string | undefined>(undefined);
    const frameBackgroundColor = frameColorOverride ?? frameColorFor(template.palette.cardSurface);
  const [cardColorOverride, setCardColorOverride] = useState<string | undefined>(undefined);
  const [cardPadding, setCardPadding] = useState(PADDING);
  const [backgroundImageUri, setBackgroundImageUri] = useState<string | undefined>();
  const [cardBackgroundImageUri, setCardBackgroundImageUri] = useState<string | undefined>();
  const [backgroundImageBlur, setBackgroundImageBlur] = useState(0);
  const [cardBackgroundImageBlur, setCardBackgroundImageBlur] = useState(0);
  const [frameEnabled, setFrameEnabled] = useState(true);
  const [cardRadiusOverride, setCardRadiusOverride] = useState<number | undefined>(undefined);
  const cardRadius = cardRadiusOverride ?? (frameEnabled ? 24 : 0);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  
  const fontMgr = useTweetFonts();

  const plan = useMemo(
    () => (fontMgr && visibleNodes.length > 0 ? planPages({ nodes: visibleNodes, template, fontMgr, cardPadding }) : null),
    [fontMgr, visibleNodes, template, cardPadding],
  );

  const isMulti = visibleNodes.length > 1 || (!!plan && plan.mode === 'series' && plan.series.length > 1);

  const pages = useMemo(() => {
    if (!plan || !isMulti) return [];
    const one = layoutChoice === 'one' || (layoutChoice === 'auto' && plan.mode === 'one');
    return one && plan.onePage ? [plan.onePage] : plan.series;
  }, [plan, layoutChoice]);


  const pageColor = cardColorOverride ?? frameColorOverride;

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
        conversation,
        setConversation,
        selection,
        setSelection,
        visibleNodes,
        template,
        setTemplate,
        frameBackgroundColor,
        setFrameBackgroundColor: setFrameColorOverride,
        cardColorOverride,
        setCardColorOverride,
        cardRadius,
        setCardRadius: setCardRadiusOverride,
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
        shape,
        isMulti, 
        plan, 
        pages, 
        layoutChoice, 
        setLayoutChoice, 
        pageColor,
        frameEnabled, 
        setFrameEnabled,
        overrides, 
        setOverride,
        resetOverride,
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
