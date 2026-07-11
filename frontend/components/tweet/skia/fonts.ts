import { useFonts } from "@shopify/react-native-skia";

// All text on the card goes through Skia's Paragraph API, which needs
// an actual font file loaded into a font manager — it can't resolve
// "the system font" the way RN <Text> can. Loaded once and shared by
// every template via this hook.
//
// Requires these two files to exist (download from fonts.google.com/specimen/Inter):
//   frontend/assets/fonts/Inter-Regular.ttf
//   frontend/assets/fonts/Inter-Bold.ttf
export function useTweetFonts() {
  return useFonts({
    Inter: [
      require("../../../assets/fonts/Inter-Regular.ttf"),
      require("../../../assets/fonts/Inter-Bold.ttf"),
    ],
  });
}

export const FONT_FAMILY = "Inter";
export const FONT_WEIGHT_REGULAR = 400;
export const FONT_WEIGHT_BOLD = 700;