export type AuthMode = 'session' | 'token';

export interface AuthConfig {
  mode: AuthMode;
  sessionId?: string;
  sessionPassword?: string;
  token?: string;
  ageGate: number;
  captureWithActiveLiveness: boolean;
  passiveLiveness: boolean;
}

export interface SdkAuthPayload {
  transactionId: string;
  requestedAgeGate: number | null;
  sessionId?: string;
  sessionPassword?: string;
  token?: string;
  features: {
    captureWithActiveLiveness: boolean;
    passiveLiveness: boolean;
  };
}

export interface AgeCheckResult {
  status: string;
  minAge: number;
  maxAge: number;
  ageIdentified: boolean;
  unsignedToken?: string;
}

export type SdkBridgeMessage =
  | { type: 'hostReady' }
  | { type: 'ready' }
  | { type: 'sessionStarted'; transactionId: string }
  | { type: 'loadProgress'; module: string; progress: number }
  | { type: 'guidance'; code: string; severity?: string }
  | { type: 'liveness'; phase: string; code: string }
  | { type: 'state'; previous: string; current: string }
  | { type: 'result'; result: AgeCheckResult }
  | { type: 'telemetry'; phase: string }
  | { type: 'error'; code: string; message: string }
  | { type: 'warn'; code: string; message: string }
  | { type: 'destroyed'; reason: string }
  | { type: 'log'; message: string };

export const STORAGE_KEY = 'headless_sdk_rn_demo_auth';
