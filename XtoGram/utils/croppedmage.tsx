import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  size: number;
  radius?: number;
};

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