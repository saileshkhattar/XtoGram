// app/(tabs)/home.tsx
import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import TopNavBar from '../../components/ui/TopNavbar';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import { Colors, Spacing, FontSize } from '../../constants/theme';

export default function Home() {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    if (!url.trim()) return;
    router.push({ pathname: '/preview', params: { url } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.BG_BASE }}>
      <TopNavBar title="Home" showBack={false} />
      <View style={{ flex: 1, padding: Spacing.screen }}>
        <Text style={{ color: Colors.TEXT_MED, fontSize: FontSize.body, marginBottom: Spacing.sm }}>
          Paste a tweet link to get started
        </Text>
        <TextField
          value={url}
          onChangeText={setUrl}
          placeholder="https://x.com/user/status/..."
        />
        <View style={{ height: Spacing.md }} />
        <Button label="Generate card" onPress={handleSubmit} />
      </View>
    </View>
  );
}