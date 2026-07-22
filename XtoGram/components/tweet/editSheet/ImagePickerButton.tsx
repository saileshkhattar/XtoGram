import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSize, Radius, Spacing } from '../../../constants/theme';

type Props = { imageUri?: string; onChange: (uri: string | undefined) => void; label: string };

/** Shared image-library action used by both editable surfaces. */
export function ImagePickerButton({ imageUri, onChange, label }: Props) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to use an image in your design.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) onChange(result.assets[0].uri);
  };
  return (
    <View style={styles.wrap}>
      <Pressable onPress={pickImage} style={styles.button}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.thumbnail} /> : <Feather name="image" color={Colors.TEXT_HIGH} size={17} />}
        <Text style={styles.label}>{imageUri ? 'Replace image' : `Add ${label} image`}</Text>
      </Pressable>
      {imageUri && <Pressable onPress={() => onChange(undefined)} hitSlop={8}><Text style={styles.remove}>Remove</Text></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  button: { flex: 1, minHeight: 44, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.BORDER, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm },
  thumbnail: { width: 28, height: 28, borderRadius: Radius.xs },
  label: { color: Colors.TEXT_HIGH, fontSize: FontSize.bodySmall, fontWeight: '600' },
  remove: { color: Colors.TEXT_LOW, fontSize: FontSize.caption },
});
