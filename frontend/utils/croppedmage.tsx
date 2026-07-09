import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  size: number;
  radius?: number;
};

// Forces any image (any aspect ratio, any resolution) into an exact
// size x size square, cropping off whatever overflows — instead of
// shrinking the whole image to fit (which is what resizeMode="contain" does).
export default function CroppedImage({ source, size, radius = 0 }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});