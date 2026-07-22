import { Image, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

type Props = {
  uri: string;
  size?: number;
};

export default function Avatar({ uri, size = 40 }: Props) {
  return (
    <Image
      source={{ uri }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.SURFACE_RAISED,
  },
});