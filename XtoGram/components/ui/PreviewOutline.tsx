import { StyleSheet, View } from 'react-native';

export const PREVIEW_RADIUS = 20;

export function PreviewOutline({ radius = PREVIEW_RADIUS }: { radius?: number }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }]}
    />
  );
}