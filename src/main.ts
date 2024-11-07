// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import "./leafletWorkaround.ts";

import "leaflet/dist/leaflet.css";
import "./style.css";

import luck from "./luck.ts";

const app: HTMLDivElement = document.querySelector("#app")!;

const MAIN_LOCATION = leaflet.latLng(36.98949379578401, -122.06277128548504);

const ZOOM_LEVEL = 19;

const map = leaflet.map(document.getElementById("map")!, {
  center: MAIN_LOCATION,
  zoom: ZOOM_LEVEL,
  minZoom: ZOOM_LEVEL,
  maxZoom: ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// background image
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(MAIN_LOCATION);
playerMarker.addTo(map);

let playerCoins = 0;
const coinText = document.createElement("h1");
coinText.innerHTML = `coins: ${playerCoins}`;
coinText.style.textAlign = "center";
app.append(coinText);

interface Cell {
  i: number;
  j: number;
  coins: number;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface GeoRect {
  topLeft: LatLng;
  bottomRight: LatLng;
}

function getRectForCell(cell: Cell): GeoRect {
  const TILE_DEGREES = 1e-4;
  return {
    topLeft: {
      lat: MAIN_LOCATION.lat + cell.i * TILE_DEGREES,
      lng: MAIN_LOCATION.lng + cell.j * TILE_DEGREES,
    },
    bottomRight: {
      lat: MAIN_LOCATION.lat + (cell.i + 1) * TILE_DEGREES,
      lng: MAIN_LOCATION.lng + (cell.j + 1) * TILE_DEGREES,
    },
  };
}

function createCell(cell: Cell) {
  const bounds = getRectForCell(cell);
  const rect = leaflet.rectangle([[bounds.topLeft.lat, bounds.topLeft.lng], [
    bounds.bottomRight.lat,
    bounds.bottomRight.lng,
  ]]);

  rect.addTo(map);
  rect.bindPopup(() => {
    const popup = document.createElement("div");
    popup.innerHTML = `
                <div>"${cell.i},${cell.j}". It has <span id="value">${cell.coins}</span> coins.</div>
                <button id="take">take</button><button id="give">give</button>`;
    popup
      .querySelector<HTMLButtonElement>("#take")!
      .addEventListener("click", () => {
        collect(cell);
        popup.querySelector<HTMLSpanElement>("#value")!.innerHTML = cell.coins
          .toString();
      });
    popup
      .querySelector<HTMLButtonElement>("#give")!
      .addEventListener("click", () => {
        deposit(cell);
        popup.querySelector<HTMLSpanElement>("#value")!.innerHTML = cell.coins
          .toString();
      });
    return popup;
  });
}

function collect(cell: Cell) {
  if (cell.coins > 0) {
    cell.coins--;
    playerCoins++;
    coinText.innerHTML = `coins: ${playerCoins}`;
  }
}
function deposit(cell: Cell) {
  if (playerCoins > 0) {
    playerCoins--;
    cell.coins++;
    coinText.innerHTML = `coins: ${playerCoins}`;
  }
}

const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    // If location i,j is lucky enough, spawn a cache!
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      createCell({
        i: i,
        j: j,
        coins: Math.floor(luck([i, j, "initialValue"].toString()) * 100),
      });
    }
  }
}
