// UChicago CampusGuessr — React + Leaflet
// ------------------------------------------------------------
// Gradient pins (grey → red) based on closeness + numbered labels,
// with the full sidebar restored.
// ------------------------------------------------------------

import { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents,
  ScaleControl,
  Polyline,
  Rectangle,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";

// ---------- Geodesy Utils ----------
const EARTH_R_M = 6371008.8; // meters
const FT_PER_M = 3.28084;

function toRad(x) {
  return (x * Math.PI) / 180;
}
function toDeg(x) {
  return (x * 180) / Math.PI;
}

function haversineMeters(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R_M * Math.asin(Math.sqrt(h));
}

function bearingDegrees(from, to) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const deg = (toDeg(θ) + 360) % 360;
  return deg;
}

function compass8(deg) {
  const dirs = [
    "⬆️",
    "↗️",
    "➡️",
    "↘️",
    "⬇️",
    "↙️",
    "⬅️",
    "↖️",
  ];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}

function formatFeet(ft) {
  if (ft < 1000) return `${Math.round(ft)} ft`;
  const miles = ft / 5280;
  if (miles < 10) return `${miles.toFixed(2)} mi`;
  return `${Math.round(miles)} mi`;
}

function ClickCapture({ setPendingPoint, campusBounds }) {
  useMapEvents({
    click(e) {
      const bounds = L.latLngBounds(campusBounds);
      if (bounds.contains(e.latlng)) {
        setPendingPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export default function CampusGuessr({
  target = { lat: 41.78972, lng: -87.59972 },
  photoUrl,
  winRadiusFeet = 10,
  maxGuesses = 6,
}) {
  const campusBounds = useMemo(() => {
    const SW = { lat: 41.7832, lng: -87.6126 };
    const NE = { lat: 41.8051, lng: -87.5860 };
    return [
      [SW.lat, SW.lng],
      [NE.lat, NE.lng],
    ];
  }, []);

  const center = useMemo(() => ({ lat: 41.7922, lng: -87.5996 }), []);

  const [pendingPoint, setPendingPoint] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const remaining = maxGuesses - guesses.length;

  function submitGuess() {
    if (!pendingPoint || isSolved || remaining <= 0) return;

    const dMeters = haversineMeters(pendingPoint, target);
    const dFeet = dMeters * FT_PER_M;
    const brg = bearingDegrees(pendingPoint, target);
    const dir = compass8(brg);

    const g = {
      point: pendingPoint,
      distanceFeet: dFeet,
      bearingDeg: brg,
      compass: dir,
    };
    const next = [...guesses, g];
    setGuesses(next);

    if (dFeet <= winRadiusFeet) {
      setIsSolved(true);
      setRevealed(true);
    } else if (next.length >= maxGuesses) {
      setRevealed(true);
    }
  }

  function resetGame() {
    setPendingPoint(null);
    setGuesses([]);
    setIsSolved(false);
    setRevealed(false);
  }

  const lastGuess = guesses[guesses.length - 1];
  const showTarget = revealed;

  // ---------- Color interpolation (grey -> red) ----------
  // t = 0 (far) → grey(128,128,128); t = 1 (close) → red(255,0,0)
  function guessColor(distanceFeet) {
    const maxDist = 5000; // tweak as needed for color scaling
    const t = Math.max(0, Math.min(1, 1 - distanceFeet / maxDist));

    // Rainbow gradient stops (black → purple → blue → green → yellow → orange → red)
    const stops = [
      [0, [0, 0, 0]],         // black
      [0.15, [128, 0, 128]],  // purple
      [0.3, [0, 0, 255]],     // blue
      [0.5, [0, 255, 0]],     // green
      [0.7, [255, 255, 0]],   // yellow
      [0.85, [255, 165, 0]],  // orange
      [1, [255, 0, 0]],       // red
    ];

    // Interpolate between the two nearest color stops
    let i = 0;
    while (i < stops.length - 1 && t > stops[i + 1][0]) i++;
    const [t1, c1] = stops[i];
    const [t2, c2] = stops[i + 1];
    const f = (t - t1) / (t2 - t1);

    const r = Math.round(c1[0] + (c2[0] - c1[0]) * f);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * f);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * f);

    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 bg-neutral-50">
      {/* Left: Map */}
      <div className="relative h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-neutral-200">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={16}
          minZoom={14}
          maxZoom={22} // allow overscaling beyond OSM native zoom
          zoomSnap={0}
          zoomDelta={0.5}
          maxBoundsViscosity={1.0}
          maxBounds={campusBounds}
          className="h-full w-full"
          zoomControl={true}
        >
          {/* Satellite imagery via Esri */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Earthstar Geographics'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={19}
            maxZoom={22}
          />

          <Rectangle bounds={campusBounds} pathOptions={{ weight: 4, dashArray: "4 4", color: "#800000", opacity: 1, fill: false}} />
          <ClickCapture setPendingPoint={setPendingPoint} campusBounds={campusBounds} />

          {/* Pending pin */}
          {pendingPoint && (
            <CircleMarker center={[pendingPoint.lat, pendingPoint.lng]} radius={7} pathOptions={{ weight: 2 }} />
          )}

          {/* Guess history with color + labels */}
          {guesses.map((g, i) => {
            const color = guessColor(g.distanceFeet);
            return (
              <CircleMarker
                key={`g-${i}`}
                center={[g.point.lat, g.point.lng]}
                radius={8}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 1,
                  weight: 0,
                  }}
              >
                <Tooltip permanent direction="top" offset={[0, -10]} className="!bg-transparent !border-0 !shadow-none">
                  <span className="font-bold text-xs text-black bg-white/80 px-1 py-0.5 rounded">
                    {i + 1}
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* Visual line from last guess to target when revealed */}
          {lastGuess && showTarget && (
            <Polyline positions={[[lastGuess.point.lat, lastGuess.point.lng], [target.lat, target.lng]]} />
          )}

          {/* Reveal target marker */}
          {showTarget && <CircleMarker center={[target.lat, target.lng]} radius={8} pathOptions={{ weight: 3 }} />}

          <ScaleControl position="bottomleft" />
        </MapContainer>

        {/* Bottom-left HUD */}
        <div className="absolute left-2 bottom-2 bg-white/90 backdrop-blur rounded-xl shadow px-3 py-2 text-sm">
          <div className="font-semibold">
            Guesses: {guesses.length} / {maxGuesses}
          </div>
          <div>Win radius: {Math.round(winRadiusFeet)} ft</div>
          {lastGuess && !isSolved && (
            <div className="mt-1">
              Last: {formatFeet(lastGuess.distanceFeet)} → {lastGuess.compass}
            </div>
          )}
          {isSolved && <div className="mt-1 text-emerald-700 font-semibold">Solved!</div>}
        </div>
      </div>

      {/* Right: Sidebar */}
      <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
        {/* Photo card */}
        <div className="bg-white rounded-2xl shadow p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Daily Photo</h2>
            <button
              onClick={resetGame}
              className="px-3 py-1 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-sm"
            >
              Reset
            </button>
          </div>
          <div className="mt-2 aspect-video w-full overflow-hidden rounded-xl bg-neutral-100 flex items-center justify-center">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Guess the location" className="w-full h-full object-cover" />
            ) : (
              <div className="text-neutral-500">Add a photoUrl to start today’s puzzle.</div>
            )}
          </div>
          {showTarget && <p className="mt-2 text-sm text-neutral-600">Answer revealed on the map.</p>}
        </div>

        {/* Guess controls */}
        <div className="bg-white rounded-2xl shadow p-3">
          <h3 className="text-base font-semibold mb-2">Make a Guess</h3>
          <ol className="list-decimal ml-5 text-sm text-neutral-700 space-y-1">
            <li>Click on the map to place your pin.</li>
            <li>
              Press <span className="font-medium">Guess</span> to submit.
            </li>
          </ol>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={submitGuess}
              disabled={!pendingPoint || isSolved || guesses.length >= maxGuesses}
              className={`px-4 py-2 rounded-xl text-sm font-semibold shadow transition ${
                !pendingPoint || isSolved || guesses.length >= maxGuesses
                  ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                  : "bg-black text-white hover:bg-neutral-800"
              }`}
            >
              Guess
            </button>
            <button
              onClick={() => setPendingPoint(null)}
              disabled={!pendingPoint}
              className={`px-3 py-2 rounded-xl text-sm border ${
                !pendingPoint
                  ? "border-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              Clear Pin
            </button>
          </div>
          {pendingPoint && (
            <div className="mt-2 text-xs text-neutral-600">
              Pending: {pendingPoint.lat.toFixed(5)}, {pendingPoint.lng.toFixed(5)}
            </div>
          )}
        </div>

        {/* Guess history */}
        <div className="bg-white rounded-2xl shadow p-3">
          <h3 className="text-base font-semibold">Guesses</h3>
          {guesses.length === 0 ? (
            <p className="text-sm text-neutral-600 mt-1">No guesses yet.</p>
          ) : (
            <ul className="mt-2 divide-y">
              {guesses.map((g, i) => (
                <li key={`row-${i}`} className="py-2 text-sm flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">Guess #{i + 1}</div>
                    <div className="text-neutral-600">
                      {g.point.lat.toFixed(5)}, {g.point.lng.toFixed(5)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatFeet(g.distanceFeet)}</div>
                    <div className="text-neutral-600">{g.compass}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Status */}
          <div className="mt-3">
            {!revealed && !isSolved && (
              <p className="text-sm text-neutral-700">
                You have <span className="font-semibold">{remaining}</span> guess
                {remaining !== 1 ? "es" : ""} left.
              </p>
            )}
            {isSolved && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
                Nice! You found it within {winRadiusFeet} ft.
              </div>
            )}
            {revealed && !isSolved && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                Out of guesses. The true location is revealed on the map.
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow p-3">
          <h3 className="text-base font-semibold">Settings</h3>
          <div className="mt-2 text-sm grid grid-cols-2 gap-2 text-neutral-700">
            <div>Win Radius</div>
            <div>{winRadiusFeet} ft</div>
            <div>Max Guesses</div>
            <div>{maxGuesses}</div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Pass these as props when embedding the component.</p>
        </div>
      </div>
    </div>
  );
}
