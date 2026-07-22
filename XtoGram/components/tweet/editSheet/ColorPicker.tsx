import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Radius, Spacing } from '../../../constants/theme';

type Props = {
  color: string;
  onChange: (color: string) => void;
};

type Hsv = { h: number; s: number; v: number };

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function hexToHsv(hex: string): Hsv {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized.length === 3 ? normalized.split('').map((v) => v + v).join('') : normalized, 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const h = delta === 0 ? 0 : max === r ? 60 * (((g - b) / delta) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
  return { h: (h + 360) % 360, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToHex({ h, s, v }: Hsv) {
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = v - chroma;
  const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${[r, g, b].map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function hueColor(hue: number) {
  return hsvToHex({ h: hue, s: 1, v: 1 });
}

/** A compact HSV picker that works with a continuous swipe, not just preset swatches. */
export function ColorPicker({ color, onChange }: Props) {
  const [pickerSize, setPickerSize] = useState({ width: 1, height: 1 });
  const [hueWidth, setHueWidth] = useState(1);
  const hsv = useMemo(() => hexToHsv(color), [color]);
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  // Decorative children are pointerEvents="none", so locationX/locationY
  // always belong to this picker surface — no stale screen measurement while
  // the parent sheet is animating up or down.
  const updateSaturationValue = (x: number, y: number) => {
    const next = { ...hsvRef.current, s: clamp(x / pickerSize.width), v: 1 - clamp(y / pickerSize.height) };
    onChange(hsvToHex(next));
  };
  const updateHue = (x: number) => onChange(hsvToHex({ ...hsvRef.current, h: clamp(x / hueWidth) * 360 }));

  const colorPan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => updateSaturationValue(event.nativeEvent.locationX, event.nativeEvent.locationY),
    onPanResponderMove: (event) => updateSaturationValue(event.nativeEvent.locationX, event.nativeEvent.locationY),
  }), [pickerSize.width, pickerSize.height, color]);
  const huePan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => updateHue(event.nativeEvent.locationX),
    onPanResponderMove: (event) => updateHue(event.nativeEvent.locationX),
  }), [hueWidth, color]);

  return (
    <View style={styles.wrap}>
      <View style={styles.picker} onLayout={(event: LayoutChangeEvent) => setPickerSize(event.nativeEvent.layout)} {...colorPan.panHandlers}>
        <LinearGradient pointerEvents="none" colors={['#FFFFFF', hueColor(hsv.h)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={['transparent', '#000000']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[styles.colorThumb, { left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }]} />
      </View>
      <View style={styles.hueTrack} onLayout={(event: LayoutChangeEvent) => setHueWidth(event.nativeEvent.layout.width)} {...huePan.panHandlers}>
        <LinearGradient pointerEvents="none" colors={['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[styles.hueThumb, { left: `${(hsv.h / 360) * 100}%` }]} />
      </View>
      <Text style={styles.value}>{color.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  picker: { height: 132, borderRadius: Radius.sm, overflow: 'hidden' },
  colorThumb: { position: 'absolute', width: 20, height: 20, marginLeft: -10, marginTop: -10, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 3, elevation: 3 },
  hueTrack: { height: 18, borderRadius: Radius.full, overflow: 'hidden' },
  hueThumb: { position: 'absolute', top: -3, width: 24, height: 24, marginLeft: -12, borderRadius: 12, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 3, elevation: 3 },
  value: { color: Colors.TEXT_MED, fontSize: FontSize.caption, fontVariant: ['tabular-nums'] },
});
