import React from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/features/auth/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { ThemeProvider } from './src/theme'; // Import from folder (index.tsx)
import { AppNavigator } from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, LogBox, View } from 'react-native';
import { OfflineBanner } from './src/components/OfflineBanner';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);

const queryClient = new QueryClient();

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <View style={{ flex: 1 }}>
                <ToastProvider>
                  <AuthProvider>
                    <AppNavigator />
                  </AuthProvider>
                </ToastProvider>
                <OfflineBanner />
              </View>
            </ThemeProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
