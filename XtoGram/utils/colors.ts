function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Lighter around dark cards, darker around light ones, so the card reads as its own surface.
export function frameColorFor(cardHex: string): string {
  const rgb = parseHex(cardHex);
  if (!rgb) return cardHex;
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  const target = lum < 0.5 ? 255 : 0;
  const amount = lum < 0.5 ? 0.11 : 0.07;
  const mixed = rgb.map((c) => Math.round(c + (target - c) * amount));
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}