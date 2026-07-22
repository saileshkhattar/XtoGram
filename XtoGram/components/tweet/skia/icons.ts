// SVG path data (24x24 viewBox) for the engagement row icons, and a
// simplified verified checkmark. These are drawn on the Skia <Canvas>
// via <Path>, since Skia can't render icon-font components (Feather,
// etc.) directly the way normal RN <Text>-based icon components do.
//
// These paths are the open-source Feather icon set (MIT license) —
// the same icon language already used elsewhere in the app via
// @expo/vector-icons — kept generic rather than reproducing X's
// specific proprietary glyphs (e.g. the verified badge below is a
// plain circle + checkmark, not X's exact scalloped-seal badge shape).
export const ICONS = {
  reply:
    "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  retweet:
    "M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
  like: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  check: "M20 6L9 17l-5-5",
} as const;

export type IconName = keyof typeof ICONS;