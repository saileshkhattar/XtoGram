import type { Palette } from "../scene/types";

// Structure (which element variant is used) and color (which palette) are
// independent axes — swapping a template's palette alone produces a
// visually distinct template with zero new components. Values pulled
// directly from DESIGN_SYSTEM.md's dark theme tokens.
export const darkPalette: Palette = {
  background: "#0A0A0F",
  // Matches today's hardcoded CARD_BG exactly — the card doesn't have a
  // surface tone distinct from its own background yet, same as before.
  cardSurface: "#0A0A0F",
  textPrimary: "#F0EEF8",
  textSecondary: "#C8C4E0",
  textMuted: "#6B6880",
  icon: "#6B6880",
  accent: "#6C5CE7",
};

// Not yet used by a template (that's step 3), included now so the palette
// axis is validated by having more than one entry.
export const lightPalette: Palette = {
  background: "#F5F4FA",
  cardSurface: "#F5F4FA",
  textPrimary: "#15131F",
  textSecondary: "#4A4760",
  textMuted: "#8A87A0",
  icon: "#4A4760",
  accent: "#6C5CE7",
};