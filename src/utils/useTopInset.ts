import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Returns the top padding needed to clear the status bar / display cutout.
 * On Android, falls back to StatusBar.currentHeight (important inside Modals
 * or when SafeAreaView hasn't measured yet) and adds a small buffer so top
 * controls sit comfortably below the system tray.
 */
export function useTopInset(extraAndroidBuffer = 8): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'android') {
    const systemTop = Math.max(insets.top, StatusBar.currentHeight ?? 0);
    return systemTop + extraAndroidBuffer;
  }
  return insets.top;
}
