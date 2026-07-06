import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { AgeCheckScreen } from './src/screens/AgeCheckScreen';

export default function App() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#111' }}>
          <AgeCheckScreen />
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
