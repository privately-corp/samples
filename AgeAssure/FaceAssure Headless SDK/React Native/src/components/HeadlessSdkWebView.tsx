import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import type { AuthConfig, SdkAuthPayload, SdkBridgeMessage } from '../types/sdk';

export interface HeadlessSdkWebViewHandle {
  start: (auth: AuthConfig) => void;
  stop: () => void;
}

interface HeadlessSdkWebViewProps {
  serverUrl: string;
  onMessage: (message: SdkBridgeMessage) => void;
}

export function buildAuthPayload(auth: AuthConfig): SdkAuthPayload {
  const transactionId =
    auth.mode === 'token' && auth.token
      ? parseJwtJti(auth.token) ?? `demo_tx_${Date.now()}`
      : `demo_tx_${Date.now()}`;

  const payload: SdkAuthPayload = {
    transactionId,
    requestedAgeGate: Number.isFinite(auth.ageGate) ? auth.ageGate : null,
    features: {
      captureWithActiveLiveness: auth.captureWithActiveLiveness,
      passiveLiveness: auth.passiveLiveness,
    },
  };

  if (auth.mode === 'token') {
    payload.token = auth.token?.trim();
  } else {
    payload.sessionId = auth.sessionId?.trim();
    payload.sessionPassword = auth.sessionPassword;
  }

  return payload;
}

function parseJwtJti(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const payload = JSON.parse(json) as { jti?: string };
    return payload.jti ?? null;
  } catch {
    return null;
  }
}

export const HeadlessSdkWebView = forwardRef<HeadlessSdkWebViewHandle, HeadlessSdkWebViewProps>(
  function HeadlessSdkWebView({ serverUrl, onMessage }, ref) {
    const webViewRef = useRef<WebView>(null);

    const postToWebView = useCallback((payload: unknown) => {
      const encoded = JSON.stringify(payload);
      const script = `
        (function() {
          document.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(encoded)} }));
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        start: (auth: AuthConfig) => {
          postToWebView({ type: 'start', auth: buildAuthPayload(auth) });
        },
        stop: () => {
          postToWebView({ type: 'stop' });
        },
      }),
      [postToWebView],
    );

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as SdkBridgeMessage;
          onMessage(message);
        } catch {
          onMessage({ type: 'log', message: event.nativeEvent.data });
        }
      },
      [onMessage],
    );

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: serverUrl }}
          style={styles.webview}
          onMessage={handleMessage}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          allowUniversalAccessFromFileURLs
          mixedContentMode="always"
          originWhitelist={['*']}
          mediaCapturePermissionGrantType="grant"
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});
