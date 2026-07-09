import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import TopNavBar from '../../components/ui/TopNavbar';
import { Colors, Spacing } from '../../constants/theme';

export default function Preview() {
  const { url } = useLocalSearchParams<{ url: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.BG_BASE }}>
      <TopNavBar title="Preview" />
      <View style={{ flex: 1, padding: Spacing.screen }}>
        <Text style={{ color: Colors.TEXT_HIGH }}>Received URL: {url}</Text>
      </View>
    </View>
  );
}