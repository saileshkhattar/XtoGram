// App.tsx
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LandingScreen from './screens/Landing';
import HomeScreen from './screens/Home';
import PreviewScreen from './screens/Preview';

export type Screen = 'landing' | 'home' | 'preview';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [tweetData, setTweetData] = useState(null);

  function navigate(to: Screen, data?: any) {
    if (data !== undefined) setTweetData(data);
    setScreen(to);
  }

  return (
    <SafeAreaProvider>
      {screen === 'landing' && (
        <LandingScreen navigate={navigate} />
      )}
      {screen === 'home' && (
        <HomeScreen navigate={navigate} />
      )}
      {screen === 'preview' && (
        <PreviewScreen navigate={navigate} tweetData={tweetData} />
      )}
    </SafeAreaProvider>
  );
}