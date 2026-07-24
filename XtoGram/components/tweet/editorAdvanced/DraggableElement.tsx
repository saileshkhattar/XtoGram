// components/tweet/editorAdvanced/DraggableElement.tsx
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { Colors } from '../../../constants/theme';
import type { PositionedElement } from '../scene/Layoutengine';
import { MIN_ELEMENT_SIZE } from '../scene/elementConstraints';
import { CARD_WIDTH } from '../skia/layout';

type Box = { x: number; y: number; width: number; height: number };

type Props = {
  positioned: PositionedElement;
  // previewWidth / CARD_WIDTH — converts between screen pixels (what the
  // gesture reports) and card-native units (what gets stored).
  scale: number;
  onCommit: (id: string, box: Box) => void;
};

// Only ever mounted for the currently-selected element (see
// ElementOverlay), keyed by element.id there — so a fresh mount, and fresh
// shared values seeded from the current box, happen automatically
// whenever selection moves to a different element.
//
// Note: bodyText/authorBlock variants currently only read `width` when
// rendering (text just wraps and renders at whatever height it needs) —
// `height` is only actually used by media variants. So resizing a text
// element's height here stores the value but won't visibly change
// anything yet; resizing its width will (text rewraps). Flagging since
// it's a pre-existing limit of those variants, not something this file
// introduces.
export function DraggableElement({ positioned, scale, onCommit }: Props) {
  const { element, x, y, width, height } = positioned;
  const minimum = MIN_ELEMENT_SIZE[element.type];

  // These ARE the live position/size in card-space, not a temporary delta
  // layered on top of props. Once a commit happens, the store's copy
  // converges to the same values these already hold — so there's nothing
  // to "snap back" while that round-trip is in flight.
  const boxX = useSharedValue(x);
  const boxY = useSharedValue(y);
  const boxWidth = useSharedValue(width);
  const boxHeight = useSharedValue(height);

  const dragStartX = useSharedValue(x);
  const dragStartY = useSharedValue(y);
  const resizeStartWidth = useSharedValue(width);
  const resizeStartHeight = useSharedValue(height);

  const commit = () => {
    onCommit(element.id, {
      x: boxX.value,
      y: boxY.value,
      width: boxWidth.value,
      height: boxHeight.value,
    });
  };

  const movePan = Gesture.Pan()
    .onStart(() => {
      dragStartX.value = boxX.value;
      dragStartY.value = boxY.value;
    })
    .onUpdate((e) => {
      boxX.value = Math.min(CARD_WIDTH - boxWidth.value, Math.max(0, dragStartX.value + e.translationX / scale));
      boxY.value = Math.max(0, dragStartY.value + e.translationY / scale);
    })
    .onEnd(() => {
      runOnJS(commit)();
    });

  const resizePan = Gesture.Pan()
    .hitSlop(12)
    .onStart(() => {
      resizeStartWidth.value = boxWidth.value;
      resizeStartHeight.value = boxHeight.value;
    })
    .onUpdate((e) => {
      boxWidth.value = Math.min(CARD_WIDTH - boxX.value, Math.max(minimum.width, resizeStartWidth.value + e.translationX / scale));
      boxHeight.value = Math.max(minimum.height, resizeStartHeight.value + e.translationY / scale);
    })
    .onEnd(() => {
      runOnJS(commit)();
    });

  // The move gesture's hit area covers the whole box, including the
  // handle's corner — without this, touching the handle would sometimes
  // also kick off a move. This tells the move gesture to stand down
  // whenever the resize gesture (attached to the smaller, nested handle
  // view) is the one that actually recognizes the touch.
  movePan.requireExternalGestureToFail(resizePan);

  const boxAnimatedStyle = useAnimatedStyle(() => ({
    left: boxX.value * scale,
    top: boxY.value * scale,
    width: boxWidth.value * scale,
    height: boxHeight.value * scale,
  }));

  return (
    <GestureDetector gesture={movePan}>
      <Animated.View style={[styles.box, boxAnimatedStyle]}>
        <GestureDetector gesture={resizePan}>
          <Animated.View style={styles.handle} />
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderRadius: 4,
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
  },
  handle: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.PRIMARY,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
