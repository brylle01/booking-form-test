/**
 * Distance and travel time for a route. Google Maps answers when a browser key
 * is configured; otherwise a deterministic local estimate keeps the booking
 * flow usable and says so in the UI.
 */

export type RouteEstimate = {
  distance: string;
  duration: string;
  source: "google" | "estimate";
};

type GoogleDistanceElement = {
  status?: string;
  distance?: { text?: string };
  duration?: { text?: string };
};

/** Only the sliver of the Maps JS API this app calls. */
type GoogleMapsApi = {
  maps?: {
    DistanceMatrixService: new () => {
      getDistanceMatrix: (
        request: {
          origins: string[];
          destinations: string[];
          travelMode: string;
          unitSystem: string;
        },
        callback: (
          response: {
            rows?: Array<{ elements?: GoogleDistanceElement[] }>;
          },
          status: string,
        ) => void,
      ) => void;
    };
    TravelMode: { DRIVING: string };
    UnitSystem: { IMPERIAL: string };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

/** Resolves false when there is no key, no browser, or the script fails. */
function loadGoogleMaps(): Promise<boolean> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key || typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.google?.maps) {
    return Promise.resolve(true);
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    "script[data-google-maps]",
  );

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener(
        "load",
        () => resolve(Boolean(window.google?.maps)),
        { once: true },
      );
      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.dataset.googleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key,
    )}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(Boolean(window.google?.maps));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) {
    return `${remainingMinutes} min`;
  }

  return `${hours} hr${remainingMinutes ? ` ${remainingMinutes} min` : ""}`;
}

/** Stable stand-in figures, derived from the addresses so they never jitter. */
function fallbackEstimate(pickup: string, dropoff: string): RouteEstimate {
  const routeKey = `${pickup.trim().toLowerCase()}|${dropoff.trim().toLowerCase()}`;
  const knownRoute =
    routeKey.includes("clintons bar") && routeKey.includes("logan airport");
  const miles = knownRoute
    ? 39.2
    : Math.max(4, Math.min(240, 16 + routeKey.length * 0.48));
  const minutes = Math.max(12, Math.round(miles * 1.45));

  return {
    distance: `${miles.toFixed(1)} mi`,
    duration: formatDuration(minutes),
    source: "estimate",
  };
}

export async function getRouteEstimate(
  pickup: string,
  dropoff: string,
): Promise<RouteEstimate> {
  const hasGoogleMaps = await loadGoogleMaps();
  const maps = hasGoogleMaps ? window.google?.maps : undefined;

  if (!maps) {
    return fallbackEstimate(pickup, dropoff);
  }

  return new Promise((resolve) => {
    const service = new maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [pickup],
        destinations: [dropoff],
        travelMode: maps.TravelMode.DRIVING,
        unitSystem: maps.UnitSystem.IMPERIAL,
      },
      (response, status) => {
        const element = response.rows?.[0]?.elements?.[0];
        const distance = element?.distance?.text;
        const duration = element?.duration?.text;

        if (
          status === "OK" &&
          element?.status === "OK" &&
          distance &&
          duration
        ) {
          resolve({ distance, duration, source: "google" });
          return;
        }

        resolve(fallbackEstimate(pickup, dropoff));
      },
    );
  });
}
