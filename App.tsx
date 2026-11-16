import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { getDb } from './src/db/client';
import { seedSampleStoryIfEmpty } from './src/db/seed';
import { RootStackParamList } from './src/navigation/types';
import LibraryScreen from './src/app/index';
import StoryEditorScreen from './src/app/editor/[storyId]';
import PlayStoryScreen from './src/app/play/[storyId]';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await getDb();
        await seedSampleStoryIfEmpty();
      } catch (err) {
        console.error('Database initialization failed:', err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Library"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Library" component={LibraryScreen} />
          <Stack.Screen name="Editor" component={StoryEditorScreen} />
          <Stack.Screen name="Play" component={PlayStoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
});
