/**
 * Drawly localStorage persistence
 *
 * Saves and restores the Excalidraw scene from browser localStorage.
 * Anonymous users rely on this for same-browser recovery.
 *
 * Key strategy:
 *  - "drawly:local-scene"   → serialized ExcalidrawElement[]
 *  - "drawly:local-appstate" → serialized partial AppState (viewBackgroundColor, zoom, scroll)
 */

const BASE_SCENE_KEY = "drawly:local-scene";
const BASE_APPSTATE_KEY = "drawly:local-appstate";

const getKeys = (roomToken?: string) => {
  if (roomToken) {
    return {
      scene: `drawly:room:${roomToken}:scene`,
      appState: `drawly:room:${roomToken}:appstate`,
    };
  }
  return {
    scene: BASE_SCENE_KEY,
    appState: BASE_APPSTATE_KEY,
  };
};

// Debounce timer reference
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 1000;

/**
 * Subset of AppState we persist locally.
 * Only visual/layout state — no ephemeral UI state.
 * Using our own interface to avoid coupling to Excalidraw's full AppState type.
 */
export interface PersistedAppState {
  viewBackgroundColor?: string;
  zoom?: { value: number };
  scrollX?: number;
  scrollY?: number;
}

/**
 * Minimal element type — we just serialize/deserialize,
 * so we don't need the full Excalidraw type here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SceneElement = Record<string, any>;

/**
 * Save scene elements and app state to localStorage.
 * Debounced to avoid thrashing on every stroke.
 */
export function saveSceneToLocalStorage(
  elements: readonly SceneElement[],
  appState: { viewBackgroundColor?: string; zoom?: { value: number }; scrollX?: number; scrollY?: number },
  roomToken?: string
): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    try {
      const { scene: sceneKey, appState: appStateKey } = getKeys(roomToken);
      const elementsJson = JSON.stringify(elements);
      localStorage.setItem(sceneKey, elementsJson);

      const persistedState: PersistedAppState = {
        viewBackgroundColor: appState.viewBackgroundColor,
        zoom: appState.zoom,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
      };
      localStorage.setItem(appStateKey, JSON.stringify(persistedState));
    } catch (err) {
      // localStorage might be full or unavailable — fail silently
      // but log for debugging
      console.warn("[Drawly] Failed to save scene to localStorage:", err);
    }
  }, DEBOUNCE_MS);
}

/**
 * Load scene elements from localStorage.
 * Returns null if no data exists or data is malformed.
 */
export function loadSceneFromLocalStorage(roomToken?: string): {
  elements: SceneElement[];
  appState: PersistedAppState;
} | null {
  try {
    const { scene: sceneKey, appState: appStateKey } = getKeys(roomToken);
    const elementsRaw = localStorage.getItem(sceneKey);
    if (!elementsRaw) {
      return null;
    }

    const elements = JSON.parse(elementsRaw);

    // Basic validation: must be an array
    if (!Array.isArray(elements)) {
      console.warn("[Drawly] Stored scene is not an array, ignoring.");
      return null;
    }

    let appState: PersistedAppState = {};
    const appStateRaw = localStorage.getItem(appStateKey);
    if (appStateRaw) {
      const parsed = JSON.parse(appStateRaw);
      if (parsed && typeof parsed === "object") {
        appState = parsed;
      }
    }

    return { elements, appState };
  } catch (err) {
    // Malformed JSON or other error — start fresh
    console.warn("[Drawly] Failed to load scene from localStorage:", err);
    return null;
  }
}

/**
 * Clear all Drawly localStorage data.
 * Useful for testing or reset flows.
 */
export function clearLocalScene(roomToken?: string): void {
  try {
    const { scene: sceneKey, appState: appStateKey } = getKeys(roomToken);
    localStorage.removeItem(sceneKey);
    localStorage.removeItem(appStateKey);
  } catch {
    // Ignore errors
  }
}
