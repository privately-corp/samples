import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { guidanceText } from '../constants/guidance';
import { useSdkServer } from '../hooks/useSdkServer';
import type { AuthConfig, SdkBridgeMessage } from '../types/sdk';
import { STORAGE_KEY } from '../types/sdk';
import { HeadlessSdkWebView, HeadlessSdkWebViewHandle } from '../components/HeadlessSdkWebView';

const DEFAULT_AUTH: AuthConfig = {
  mode: 'session',
  sessionId: '',
  sessionPassword: '',
  token: '',
  ageGate: 25,
  captureWithActiveLiveness: true,
  passiveLiveness: true,
};

export function AgeCheckScreen() {
  const { serverUrl, loading, error: serverError, localhostHint } = useSdkServer();
  const webViewRef = useRef<HeadlessSdkWebViewHandle>(null);

  const [auth, setAuth] = useState<AuthConfig>(DEFAULT_AUTH);
  const [hostReady, setHostReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Preparing SDK host…');
  const [pipelineState, setPipelineState] = useState('IDLE');
  const [guidance, setGuidance] = useState('—');
  const [result, setResult] = useState('—');
  const [eventLog, setEventLog] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<AuthConfig>;
        setAuth((current) => ({ ...current, ...saved }));
      })
      .catch(() => undefined);
  }, []);

  const persistAuth = useCallback((next: AuthConfig) => {
    setAuth(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const appendLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setEventLog((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 80));
  }, []);

  const handleSdkMessage = useCallback(
    (message: SdkBridgeMessage) => {
      switch (message.type) {
        case 'hostReady':
          setHostReady(true);
          setStatus('SDK host ready. Enter credentials and start an age check.');
          appendLog('SDK host ready');
          break;
        case 'ready':
          setStatus('SDK ready. Running analysis…');
          appendLog('onReady');
          break;
        case 'sessionStarted':
          setRunning(true);
          appendLog(`Session started (${message.transactionId})`);
          break;
        case 'loadProgress':
          setStatus(`Loading ${message.module} (${Math.round(message.progress * 100)}%)`);
          break;
        case 'guidance':
          setGuidance(`${guidanceText(message.code)} — ${message.code}`);
          break;
        case 'liveness':
          if (message.phase === 'failed') {
            appendLog(`onLiveness failed: ${message.code}`);
          }
          setGuidance(`${guidanceText(message.code)} — ${message.code}`);
          break;
        case 'state':
          setPipelineState(message.current);
          appendLog(`state ${message.previous} → ${message.current}`);
          break;
        case 'result': {
          const summary = `${message.result.status} | age ${message.result.minAge}-${message.result.maxAge} | gate ${message.result.ageIdentified}`;
          setResult(summary);
          appendLog(`onResult: ${summary}`);
          break;
        }
        case 'telemetry':
          appendLog(`onTelemetry: ${message.phase}`);
          break;
        case 'error':
          appendLog(`onError [${message.code}]: ${message.message}`);
          setStatus(message.message);
          setRunning(false);
          break;
        case 'warn':
          appendLog(`onWarn [${message.code}]: ${message.message}`);
          break;
        case 'destroyed':
          appendLog(`onDestroyed (${message.reason})`);
          setStatus(`Session ended (${message.reason}).`);
          setRunning(false);
          break;
        case 'log':
          appendLog(message.message);
          break;
        default:
          break;
      }
    },
    [appendLog],
  );

  const validateAuth = useCallback((): string | null => {
    if (auth.mode === 'token') {
      if (!auth.token?.trim()) {
        return 'Enter a JWT token or switch to session credentials.';
      }
      return null;
    }
    if (!auth.sessionId?.trim() || !auth.sessionPassword) {
      return 'Enter both session ID and session password.';
    }
    return null;
  }, [auth]);

  const handleStart = useCallback(() => {
    const validationError = validateAuth();
    if (validationError) {
      setStatus(validationError);
      appendLog(validationError);
      return;
    }
    if (!hostReady) {
      setStatus('SDK host is still loading.');
      return;
    }

    setResult('—');
    setGuidance('—');
    setStatus('Starting age check…');
    webViewRef.current?.start(auth);
  }, [appendLog, auth, hostReady, validateAuth]);

  const handleStop = useCallback(() => {
    appendLog('User requested stop()');
    webViewRef.current?.stop();
  }, [appendLog]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#93c5fd" />
        <Text style={styles.muted}>Preparing on-device SDK server…</Text>
      </View>
    );
  }

  if (serverError || !serverUrl) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not start SDK server</Text>
        <Text style={styles.muted}>{serverError ?? 'Unknown error'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Headless Age Estimation SDK</Text>
        <Text style={styles.subtitle}>{localhostHint}</Text>

        <View style={styles.row}>
          <Pressable
            style={[styles.chip, auth.mode === 'session' && styles.chipActive]}
            onPress={() => persistAuth({ ...auth, mode: 'session' })}
            disabled={running}
          >
            <Text style={styles.chipText}>Session credentials</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, auth.mode === 'token' && styles.chipActive]}
            onPress={() => persistAuth({ ...auth, mode: 'token' })}
            disabled={running}
          >
            <Text style={styles.chipText}>JWT token</Text>
          </Pressable>
        </View>

        {auth.mode === 'session' ? (
          <>
            <Text style={styles.label}>Session ID</Text>
            <TextInput
              style={styles.input}
              value={auth.sessionId}
              onChangeText={(sessionId) => persistAuth({ ...auth, sessionId })}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!running}
              placeholder="api_key / session UUID"
              placeholderTextColor="#666"
            />
            <Text style={styles.label}>Session password</Text>
            <TextInput
              style={styles.input}
              value={auth.sessionPassword}
              onChangeText={(sessionPassword) => persistAuth({ ...auth, sessionPassword })}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!running}
              placeholder="api_secret"
              placeholderTextColor="#666"
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>JWT token</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={auth.token}
              onChangeText={(token) => persistAuth({ ...auth, token })}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              editable={!running}
              placeholder="Paste a pre-issued Privately session JWT"
              placeholderTextColor="#666"
            />
          </>
        )}

        <Text style={styles.label}>Requested age gate</Text>
        <TextInput
          style={styles.input}
          value={String(auth.ageGate)}
          onChangeText={(value) =>
            persistAuth({ ...auth, ageGate: Number(value) || 0 })
          }
          keyboardType="number-pad"
          editable={!running}
        />

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Active liveness</Text>
          <Switch
            value={auth.captureWithActiveLiveness}
            onValueChange={(captureWithActiveLiveness) =>
              persistAuth({ ...auth, captureWithActiveLiveness })
            }
            disabled={running}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Passive liveness</Text>
          <Switch
            value={auth.passiveLiveness}
            onValueChange={(passiveLiveness) => persistAuth({ ...auth, passiveLiveness })}
            disabled={running}
          />
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.primaryButton, (running || !hostReady) && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={running || !hostReady}
          >
            <Text style={styles.buttonText}>Start age check</Text>
          </Pressable>
          <Pressable
            style={[styles.button, !running && styles.buttonDisabled]}
            onPress={handleStop}
            disabled={!running}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </Pressable>
        </View>

        <Text style={styles.status}>{status}</Text>
      </ScrollView>

      <View style={styles.previewPanel}>
        <HeadlessSdkWebView ref={webViewRef} serverUrl={serverUrl} onMessage={handleSdkMessage} />
      </View>

      <ScrollView style={styles.metrics} contentContainerStyle={styles.metricsContent}>
        <Text style={styles.metricLabel}>Pipeline state</Text>
        <Text style={styles.metricValue}>{pipelineState}</Text>
        <Text style={styles.metricLabel}>Guidance</Text>
        <Text style={styles.metricValue}>{guidance}</Text>
        <Text style={styles.metricLabel}>Result</Text>
        <Text style={styles.metricValue}>{result}</Text>
        <Text style={styles.metricLabel}>Event log</Text>
        <Text style={styles.log}>{eventLog.join('\n') || '—'}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    padding: 24,
    gap: 12,
  },
  form: {
    padding: 16,
    gap: 8,
  },
  title: {
    color: '#f5f5f5',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: '#93c5fd',
    backgroundColor: '#1e293b',
  },
  chipText: {
    color: '#f5f5f5',
    fontSize: 13,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    backgroundColor: '#0d0d0d',
    color: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  toggleLabel: {
    color: '#f5f5f5',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#222',
  },
  primaryButton: {
    borderColor: '#2563eb',
    backgroundColor: '#1d4ed8',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  status: {
    color: '#cbd5e1',
    marginTop: 8,
    fontSize: 14,
  },
  previewPanel: {
    height: 280,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  metrics: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#1b1b1b',
  },
  metricsContent: {
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    color: '#aaa',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  metricValue: {
    color: '#f5f5f5',
    fontSize: 14,
  },
  log: {
    color: '#cbd5e1',
    fontFamily: 'Menlo',
    fontSize: 11,
    lineHeight: 16,
  },
  muted: {
    color: '#888',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 18,
    fontWeight: '700',
  },
});
