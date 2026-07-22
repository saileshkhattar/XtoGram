import { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../../../constants/theme';

type Props = { value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Shared precise drag control for size and image effects. */
export function ValueSlider({ value, min, max, step = 1, suffix = 'px', onChange }: Props) {
  const [width, setWidth] = useState(1);
  const update = (x: number) => {
    const raw = min + clamp(x / width, 0, 1) * (max - min);
    onChange(clamp(Math.round(raw / step) * step, min, max));
  };
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => update(event.nativeEvent.locationX),
    onPanResponderMove: (event) => update(event.nativeEvent.locationX),
  }), [width, min, max, step, value]);
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}><Text style={styles.value}>{value}{suffix}</Text></View>
      <View style={styles.track} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} {...pan.panHandlers}>
        <View pointerEvents="none" style={[styles.fill, { width: `${progress}%` }]} />
        <View pointerEvents="none" style={[styles.thumb, { left: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'flex-end' },
  value: { color: Colors.TEXT_MED, fontSize: FontSize.caption, fontVariant: ['tabular-nums'] },
  track: { height: 28, justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: 4, borderRadius: Radius.full, backgroundColor: Colors.TEXT_HIGH },
  thumb: { position: 'absolute', width: 18, height: 18, marginLeft: -9, borderRadius: Radius.full, backgroundColor: Colors.TEXT_HIGH, borderWidth: 3, borderColor: Colors.SURFACE_RAISED },
});
