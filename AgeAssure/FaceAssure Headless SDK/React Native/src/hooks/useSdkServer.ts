import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  writeAsStringAsync,
} from 'expo-file-system';
import { Asset } from 'expo-asset';
import StaticServer from '@dr.pogodin/react-native-static-server';
import {
  INDEX_HTML_MODULE,
  SDK_ASSETS,
  SDK_ASSETS_READY,
} from './sdkAssets.generated';

const SDK_ASSETS_ALL: Array<{ module: number; fileName: string }> = [
  { module: INDEX_HTML_MODULE, fileName: 'index.html' },
  ...SDK_ASSETS,
];

const REQUIRED_FILES = [
  'index.html',
  'headless-sdk.js',
  'nannie.wasm',
  'yummie.wasm',
  'lemmie.wasm',
];

const MISSING_SDK_MESSAGE =
  'SDK binaries are missing. Copy your licensed FaceAssure Headless SDK files into assets/sdk/, then run npm run generate-sdk-assets.';

async function ensureSdkAssets(sdkDir: string): Promise<void> {
  const marker = `${sdkDir}.ready`;
  const markerInfo = await getInfoAsync(marker);
  if (markerInfo.exists) {
    return;
  }

  await makeDirectoryAsync(sdkDir, { intermediates: true });

  for (const { module, fileName } of SDK_ASSETS_ALL) {
    const target = `${sdkDir}${fileName}`;
    const existing = await getInfoAsync(target);
    if (existing.exists) {
      continue;
    }

    const asset = Asset.fromModule(module);
    await asset.downloadAsync();
    if (!asset.localUri) {
      throw new Error(`Failed to load bundled asset: ${fileName}`);
    }
    await copyAsync({ from: asset.localUri, to: target });
  }

  for (const fileName of REQUIRED_FILES) {
    const info = await getInfoAsync(`${sdkDir}${fileName}`);
    if (!info.exists) {
      throw new Error(`Missing SDK asset after copy: ${fileName}`);
    }
  }

  await writeAsStringAsync(marker, 'ok');
}

export function useSdkServer() {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let server: StaticServer | null = null;
    let cancelled = false;

    async function prepare() {
      try {
        if (!SDK_ASSETS_READY) {
          throw new Error(MISSING_SDK_MESSAGE);
        }

        if (!documentDirectory) {
          throw new Error('Document directory is unavailable on this platform.');
        }

        const sdkDir = `${documentDirectory}headless-sdk/`;
        await ensureSdkAssets(sdkDir);

        const serverDir = sdkDir.replace(/^file:\/\//, '');

        server = new StaticServer({
          port: 0,
          fileDir: serverDir,
          nonLocal: false,
        });

        const origin = await server.start();
        if (cancelled) {
          await server.stop();
          return;
        }

        setServerUrl(`${origin}/index.html`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    prepare();

    return () => {
      cancelled = true;
      if (server) {
        server.stop().catch(() => undefined);
      }
    };
  }, []);

  return {
    serverUrl,
    error,
    loading,
    localhostHint:
      Platform.OS === 'android'
        ? 'Serving SDK from on-device localhost (required for camera + WASM).'
        : 'Serving SDK from on-device localhost.',
  };
}
