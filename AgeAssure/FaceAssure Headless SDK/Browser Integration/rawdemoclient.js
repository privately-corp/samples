(function () {
  "use strict";

  /**
   * Must match the <script src="…"> URL in index.html.
   * Used only for error messages when the bundle fails to load.
   */
  const SDK_BUNDLE_URL =
    "https://YOUR_CDN_HOST/path/to/headless-sdk.js";

  const STORAGE_KEY = "headless_sdk_demo_auth";

  const GUIDANCE_COPY = {
    MOVE_INTO_FRAME: "Position your face in the frame",
    FACE_TOO_CLOSE: "Move back a little",
    FACE_TOO_FAR: "Move closer",
    HEAD_TOO_LEFT: "Turn your head slightly right",
    HEAD_TOO_RIGHT: "Turn your head slightly left",
    HEAD_TOO_UP: "Lower your chin",
    HEAD_TOO_DOWN: "Raise your chin",
    HEAD_TILTED_LEFT: "Straighten your head",
    HEAD_TILTED_RIGHT: "Straighten your head",
    IMAGE_NOT_BRIGHT_ENOUGH: "Find better lighting",
    IMAGE_TOO_BLURRY: "Clean camera lens",
    VALID_CAPTURE_STATE: "Hold steady",
    IMAGE_QUALITY_SUFFICIENT: "Checking quality…",
    OPEN_YOUR_MOUTH: "Open your mouth",
    KEEP_YOUR_MOUTH_OPEN: "Keep your mouth open",
    CLOSE_YOUR_MOUTH: "Close your mouth",
    SMILE: "Smile",
  };

  const ui = {
    preview: document.getElementById("preview"),
    startBtn: document.getElementById("startBtn"),
    stopBtn: document.getElementById("stopBtn"),
    retryBtn: document.getElementById("retryBtn"),
    statusLine: document.getElementById("statusLine"),
    stateValue: document.getElementById("stateValue"),
    guidanceValue: document.getElementById("guidanceValue"),
    resultValue: document.getElementById("resultValue"),
    eventLog: document.getElementById("eventLog"),
    authModeSession: document.getElementById("authModeSession"),
    authModeToken: document.getElementById("authModeToken"),
    sessionFields: document.getElementById("sessionFields"),
    tokenFields: document.getElementById("tokenFields"),
    sessionIdInput: document.getElementById("sessionIdInput"),
    sessionPasswordInput: document.getElementById("sessionPasswordInput"),
    tokenInput: document.getElementById("tokenInput"),
    ageGateInput: document.getElementById("ageGateInput"),
    captureWithActiveLivenessInput: document.getElementById(
      "captureWithActiveLivenessInput"
    ),
    passiveLivenessInput: document.getElementById("passiveLivenessInput"),
    authInputs: document.querySelectorAll(
      "#sessionIdInput, #sessionPasswordInput, #tokenInput, #ageGateInput, #captureWithActiveLivenessInput, #passiveLivenessInput, input[name='authMode']"
    ),
  };

  let activeStream = null;
  let activeSdk = null;
  let sdkReadyPromise = null;

  function getSdkConstructor() {
    const sdk = window.HeadlessSDK;
    return typeof sdk === "function" ? sdk : null;
  }

  function waitForSdkConstructor(timeoutMs) {
    const limit = timeoutMs == null ? 15000 : timeoutMs;
    const existing = getSdkConstructor();
    if (existing) {
      return Promise.resolve(existing);
    }

    if (!sdkReadyPromise) {
      sdkReadyPromise = new Promise(function (resolve, reject) {
        const deadline = Date.now() + limit;

        (function poll() {
          const sdk = getSdkConstructor();
          if (sdk) {
            resolve(sdk);
            return;
          }
          if (Date.now() >= deadline) {
            sdkReadyPromise = null;
            reject(
              new Error(
                "HeadlessSDK did not become available. Check the CDN script URL in index.html."
              )
            );
            return;
          }
          window.setTimeout(poll, 50);
        })();
      });
    }

    return sdkReadyPromise;
  }

  async function reportSdkAvailability() {
    if (window.__headlessSdkBundleFailed) {
      const message = "Could not load SDK bundle from " + SDK_BUNDLE_URL;
      setStatus(message);
      logEvent(message);
      ui.startBtn.disabled = true;
      return;
    }

    setStatus("Loading SDK bundle…");
    try {
      await waitForSdkConstructor();
      setStatus("Ready. Enter credentials, then start an age check.");
      logEvent("HeadlessSDK bundle loaded");
      ui.startBtn.disabled = false;
    } catch (error) {
      setStatus(error.message);
      logEvent(error.message);
      ui.startBtn.disabled = true;
    }
  }

  function logEvent(message) {
    const line = `[${new Date().toLocaleTimeString()}] ${message}\n`;
    ui.eventLog.textContent = line + ui.eventLog.textContent;
  }

  function setStatus(text) {
    ui.statusLine.textContent = text;
  }

  function guidanceText(code) {
    var guidance = GUIDANCE_COPY[code] || code;
    return guidance + " - " + code;
  }

  function renderGuidance(code, severity) {
    ui.guidanceValue.textContent = guidanceText(code);
    ui.guidanceValue.className = "value hint-" + (severity || "info");
  }

  function getAuthMode() {
    return ui.authModeToken.checked ? "token" : "session";
  }

  function setAuthMode(mode) {
    const useToken = mode === "token";
    ui.authModeToken.checked = useToken;
    ui.authModeSession.checked = !useToken;
    ui.sessionFields.hidden = useToken;
    ui.tokenFields.hidden = !useToken;
  }

  function saveAuthToStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: getAuthMode(),
          sessionId: ui.sessionIdInput.value.trim(),
          sessionPassword: ui.sessionPasswordInput.value,
          token: ui.tokenInput.value.trim(),
          ageGate: ui.ageGateInput.value,
          captureWithActiveLiveness: ui.captureWithActiveLivenessInput.checked,
          passiveLiveness: ui.passiveLivenessInput.checked,
        })
      );
    } catch (error) {
      // Ignore storage failures in restricted environments.
    }
  }

  function loadAuthFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw);
      setAuthMode(saved.mode === "token" ? "token" : "session");
      ui.sessionIdInput.value = saved.sessionId || "";
      ui.sessionPasswordInput.value = saved.sessionPassword || "";
      ui.tokenInput.value = saved.token || "";
      if (saved.ageGate != null && saved.ageGate !== "") {
        ui.ageGateInput.value = saved.ageGate;
      }
      if (typeof saved.captureWithActiveLiveness === "boolean") {
        ui.captureWithActiveLivenessInput.checked = saved.captureWithActiveLiveness;
      }
      if (typeof saved.passiveLiveness === "boolean") {
        ui.passiveLivenessInput.checked = saved.passiveLiveness;
      }
    } catch (error) {
      // Ignore corrupt storage.
    }
  }

  function setAuthInputsDisabled(disabled) {
    ui.authInputs.forEach(function (input) {
      input.disabled = disabled;
    });
  }

  function parseJwtPayload(token) {
    try {
      if (!token || typeof token !== "string") {
        return null;
      }
      if (token.includes("%")) {
        token = decodeURIComponent(token);
      }
      const parts = token.split(".");
      if (parts.length < 2) {
        return null;
      }
      let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      b64 += "=".repeat((4 - (b64.length % 4)) % 4);
      const binary = atob(b64);
      const json = decodeURIComponent(
        Array.from(binary, function (c) {
          return "%" + c.charCodeAt(0).toString(16).padStart(2, "0");
        }).join("")
      );
      return JSON.parse(json);
    } catch (error) {
      return null;
    }
  }

  function readAuthContext() {
    const mode = getAuthMode();
    const ageGateValue = Number(ui.ageGateInput.value);
    const auth = {
      transactionId: "demo_tx_" + Date.now(),
      requestedAgeGate: Number.isFinite(ageGateValue) ? ageGateValue : null,
    };

    if (mode === "token") {
      auth.token = ui.tokenInput.value.trim();
      if (!auth.token) {
        throw new Error("Enter a JWT token or switch to session credentials.");
      }
      const jwtPayload = parseJwtPayload(auth.token);
      if (jwtPayload && jwtPayload.jti) {
        auth.transactionId = jwtPayload.jti;
      }
      return auth;
    }

    auth.sessionId = ui.sessionIdInput.value.trim();
    auth.sessionPassword = ui.sessionPasswordInput.value;
    if (!auth.sessionId || !auth.sessionPassword) {
      throw new Error("Enter both session ID and session password, or switch to JWT token mode.");
    }
    return auth;
  }

  function buildSdkConfig(auth) {
    const captureWithActiveLiveness = ui.captureWithActiveLivenessInput.checked;
    const passiveLiveness = ui.passiveLivenessInput.checked;

    const config = {
      transactionId: auth.transactionId,
      requestedAgeGate: auth.requestedAgeGate,
      features: {
        captureWithActiveLiveness: captureWithActiveLiveness,
        passiveLiveness: passiveLiveness,
      },
      onLoadProgress: function (event) {
        setStatus("Loading " + event.module + " (" + Math.round(event.progress * 100) + "%)");
      },
      onReady: function () {
        logEvent("onReady");
        setStatus("SDK ready. Attach camera and run analysis.");
      },
      onGuidance: function (event) {
        renderGuidance(event.code, event.severity);
      },
      onLiveness: function (event) {
        if (event.phase === "instruction" || event.phase === "in_progress") {
          renderGuidance(event.code, "info");
        }
        if (event.phase === "failed") {
          renderGuidance(event.code, "blocking");
          logEvent("onLiveness failed: " + event.code);
        }
      },
      onState: function (event) {
        ui.stateValue.textContent = event.current;
        logEvent("state " + event.previous + " → " + event.current);
      },
      onResult: function (result) {
        const summary =
          result.status +
          " | age " +
          result.minAge +
          "-" +
          result.maxAge +
          " | gate " +
          result.ageIdentified;
        ui.resultValue.textContent = summary;
        logEvent("onResult: " + summary);
        if (result.unsignedToken) {
          logEvent("unsignedToken emitted (truncated): " + result.unsignedToken.slice(0, 48) + "…");
        }
      },
      onTelemetry: function (event) {
        logEvent("onTelemetry: " + event.phase);
      },
      onError: function (error) {
        logEvent("onError [" + error.code + "]: " + error.message);
      },
      onWarn: function (warning) {
        logEvent("onWarn [" + warning.code + "]: " + warning.message);
      },
      onDestroyed: function (event) {
        logEvent("onDestroyed (" + event.reason + ")");
        stopCameraStream();
        activeSdk = null;
        setAuthInputsDisabled(false);
        ui.startBtn.disabled = false;
        ui.stopBtn.disabled = true;
        ui.retryBtn.disabled = false;
        setStatus("Session ended (" + event.reason + "). Use Retry to run again.");
      },
    };

    if (auth.token) {
      config.token = auth.token;
    } else {
      config.sessionId = auth.sessionId;
      config.sessionPassword = auth.sessionPassword;
    }

    return config;
  }

  async function acquireCameraStream() {
    if (activeStream) {
      return activeStream;
    }
    activeStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    ui.preview.srcObject = activeStream;
    return activeStream;
  }

  function stopCameraStream() {
    if (!activeStream) return;
    activeStream.getTracks().forEach(function (track) {
      track.stop();
    });
    activeStream = null;
    ui.preview.srcObject = null;
  }

  async function runAgeCheck() {
    let SdkConstructor;
    try {
      SdkConstructor = await waitForSdkConstructor();
    } catch (error) {
      setStatus(error.message);
      logEvent(error.message);
      return;
    }

    let auth;
    try {
      auth = readAuthContext();
      saveAuthToStorage();
    } catch (error) {
      setStatus(error.message);
      logEvent("Auth validation failed: " + error.message);
      return;
    }

    ui.startBtn.disabled = true;
    ui.stopBtn.disabled = false;
    ui.retryBtn.disabled = true;
    setAuthInputsDisabled(true);
    ui.resultValue.textContent = "—";
    setStatus("Initializing SDK…");
    logEvent(
      "Starting transaction " +
        auth.transactionId +
        " (" +
        (auth.token ? "JWT token" : "session credentials") +
        ", activeLiveness=" +
        ui.captureWithActiveLivenessInput.checked +
        ", passiveLiveness=" +
        ui.passiveLivenessInput.checked +
        ")"
    );

    const sdk = new SdkConstructor(buildSdkConfig(auth));
    activeSdk = sdk;

    try {
      await sdk.ready();
      await acquireCameraStream();
      await sdk.attachVideo(ui.preview);
      await sdk.start();
      setStatus("Analysis running…");
      await sdk.getResult();
    } catch (error) {
      logEvent("Run failed: " + (error.message || error));
      setStatus(error.message || "Run failed");
      setAuthInputsDisabled(false);
      ui.startBtn.disabled = false;
      ui.stopBtn.disabled = true;
      ui.retryBtn.disabled = false;
    }
  }

  ui.authModeSession.addEventListener("change", function () {
    if (ui.authModeSession.checked) {
      setAuthMode("session");
      saveAuthToStorage();
    }
  });

  ui.authModeToken.addEventListener("change", function () {
    if (ui.authModeToken.checked) {
      setAuthMode("token");
      saveAuthToStorage();
    }
  });

  [
    ui.sessionIdInput,
    ui.sessionPasswordInput,
    ui.tokenInput,
    ui.ageGateInput,
    ui.captureWithActiveLivenessInput,
    ui.passiveLivenessInput,
  ].forEach(function (input) {
    input.addEventListener("change", saveAuthToStorage);
  });

  ui.startBtn.addEventListener("click", runAgeCheck);
  ui.retryBtn.addEventListener("click", runAgeCheck);

  ui.stopBtn.addEventListener("click", function () {
    if (activeSdk) {
      logEvent("User requested stop()");
      activeSdk.stop();
    }
  });

  loadAuthFromStorage();
  reportSdkAvailability();
})();
