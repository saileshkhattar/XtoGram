// components/tweet/editorAdvanced/ElementOverlay.tsx
//
// Sits on top of a read-only SceneRenderer at the same scale. Skia paints
// pixels, not tappable objects — so this is what actually catches taps.
// Every box here comes from the same `positioned` list SceneRenderer just
// painted from (passed down via onLayoutComputed), so a highlighted/
// selected box always lines up exactly with what's visible underneath.
//
// The selected element gets a DraggableElement (live drag, see that file)
// instead of a plain tap target — only one element is ever draggable at a
// time, so there's exactly one active gesture, not one per element.
import { Pressable, StyleSheet, View } from 'react-native';
import type { PositionedElement } from '../scene/Layoutengine';
import { DraggableElement } from './DraggableElement';

type Box = { x: number; y: number; width: number; height: number };

type Props = {
  positioned: PositionedElement[];
  // previewWidth / CARD_WIDTH — same scale factor CardResult/the editor
  // screen uses to shrink the 1080px-wide card down to fit the screen.
  scale: number;
  selectedElementId: string | null;
  onSelect: (id: string) => void;
  onCommitPosition: (id: string, box: Box) => void;
};

export function ElementOverlay({ positioned, scale, selectedElementId, onSelect, onCommitPosition }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {positioned.map((entry) => {
        const { element, x, y, width, height } = entry;

        if (element.id === selectedElementId) {
          return <DraggableElement key={element.id} positioned={entry} scale={scale} onCommit={onCommitPosition} />;
        }

        return (
          <Pressable
            key={element.id}
            onPress={() => onSelect(element.id)}
            style={[
              styles.hitZone,
              { left: x * scale, top: y * scale, width: width * scale, height: height * scale },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  hitZone: {
    position: 'absolute',
    borderRadius: 4,
  },
});