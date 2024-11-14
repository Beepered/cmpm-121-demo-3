// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import "./leafletWorkaround.ts";

import "leaflet/dist/leaflet.css";
import "./style.css";

import luck from "./luck.ts";

import { Cell, Coin, GeoCache, GeoRect, LatLng } from "./interfaces.ts";

const bus = new EventTarget();

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
  dragging: false,
  keyboard: false,
  closePopupOnClick: false,
});

const playerLocation: LatLng = {
  lat: MAIN_LOCATION.lat,
  lng: MAIN_LOCATION.lng,
};
const playerMarker = leaflet.marker(playerLocation);
playerMarker.addTo(map);

// background image
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: ZOOM_LEVEL,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerCoins: Coin[] = [];

const coinText = document.createElement("h1");
coinText.innerHTML = `inventory:`;
coinText.style.textAlign = "center";
app.append(coinText);

const inventoryText = document.createElement("p");
inventoryText.style.textAlign = "center";
app.append(inventoryText);

const DEGREES_PER_TILE = 1e-4;
function getRectForCell(i: number, j: number): GeoRect {
  return {
    topLeft: {
      lat: (i - 0.5) * DEGREES_PER_TILE,
      lng: (j - 0.5) * DEGREES_PER_TILE,
    },
    bottomRight: {
      lat: (i + 0.5) * DEGREES_PER_TILE,
      lng: (j + 0.5) * DEGREES_PER_TILE,
    },
  };
}

function createCache(cell: Cell): GeoCache {
  const inventory: Coin[] = [];
  for (
    let x = 0;
    x <
      Math.floor(luck([cell.i, cell.j, "initialValue"].toString()) * 10);
    x++
  ) {
    inventory.push({
      homeCell: cell,
      serial: x,
    });
  }

  const bounds = getRectForCell(cell.i, cell.j);
  const rect = leaflet.rectangle([
    [bounds.topLeft.lat, bounds.topLeft.lng],
    [bounds.bottomRight.lat, bounds.bottomRight.lng],
  ]);
  rect.addTo(map);

  rect.bindPopup(() => {
    const popup = document.createElement("div");
    popup.innerHTML = `${cell.i}, ${cell.j}<br>`;
    const takeDiv = document.createElement("div");
    popup.append(takeDiv);
    const giveDiv = document.createElement("div");
    popup.append(giveDiv);
    updateCellDiv(inventory, takeDiv, giveDiv);
    return popup;
  });
  rect.addTo(map);

  return inventory;
}

function collect(cache: GeoCache, coin: Coin) { // takes coin and gives to player
  if (cache.length > 0) {
    playerCoins.push(coin);
    const index = cache.indexOf(coin);
    cache.splice(index, 1);
    updateInventoryText();
  }
}
function deposit(cache: GeoCache, coin: Coin) { // takes coin and gives to cell
  if (playerCoins.length > 0) {
    cache.push(coin);
    const index = playerCoins.indexOf(coin);
    playerCoins.splice(index, 1);
    updateInventoryText();
  }
}

function displayTakeCoins(
  cache: GeoCache,
  takeDiv: HTMLDivElement,
  giveDiv: HTMLDivElement,
) {
  for (let x = 0; x < cache.length; x++) {
    const buttonDiv = document.createElement("div");
    const button = document.createElement("button");
    button.innerHTML = `take`;
    buttonDiv.append(button);
    button.addEventListener("click", () => {
      collect(cache, cache[x]);
      updateCellDiv(cache, takeDiv, giveDiv);
    });
    buttonDiv.append(
      `${cache[x].homeCell.i}:${cache[x].homeCell.j}#${cache[x].serial}`,
    );
    takeDiv.append(buttonDiv);
  }
}

function displayGiveCoins(
  cache: GeoCache,
  takeDiv: HTMLDivElement,
  giveDiv: HTMLDivElement,
) {
  for (let x = 0; x < playerCoins.length; x++) {
    const buttonDiv = document.createElement("div");
    const button = document.createElement("button");
    button.innerHTML = `give`;
    buttonDiv.append(button);
    button.addEventListener("click", () => {
      deposit(cache, playerCoins[x]);
      updateCellDiv(cache, takeDiv, giveDiv);
    });
    buttonDiv.append(
      `${playerCoins[x].homeCell.i}:${playerCoins[x].homeCell.j}#${
        playerCoins[x].serial
      }`,
    );
    giveDiv.append(buttonDiv);
  }
}

function updateInventoryText() {
  inventoryText.innerHTML = ``;
  for (let x = 0; x < playerCoins.length; x++) {
    inventoryText.innerHTML += `${playerCoins[x].homeCell.i}:${
      playerCoins[x].homeCell.j
    }#${playerCoins[x].serial}<br>`;
  }
}

function updateCellDiv(
  cache: GeoCache,
  takeDiv: HTMLDivElement,
  giveDiv: HTMLDivElement,
) {
  takeDiv.innerHTML = ``;
  if (cache.length > 0) {
    takeDiv.innerHTML += `<div>TAKE</div>`;
    displayTakeCoins(cache, takeDiv, giveDiv);
  }

  giveDiv.innerHTML = ``;
  if (playerCoins.length > 0) {
    giveDiv.innerHTML += `<div>GIVE</div>`;
    displayGiveCoins(cache, takeDiv, giveDiv);
  }
}

function getCellForLatLng(latLng: LatLng): Cell {
  return {
    i: Math.floor(latLng.lat / DEGREES_PER_TILE),
    j: Math.floor(latLng.lng / DEGREES_PER_TILE),
  };
}

function createCellsAroundPlayer() {
  const playerCell = getCellForLatLng(playerLocation);
  const NEIGHBORHOOD_SIZE = 5;
  const CACHE_SPAWN_PROBABILITY = 0.1;
  for (let dI = -NEIGHBORHOOD_SIZE; dI < NEIGHBORHOOD_SIZE; dI++) {
    for (let dJ = -NEIGHBORHOOD_SIZE; dJ < NEIGHBORHOOD_SIZE; dJ++) {
      // If location i,j is lucky enough, spawn a cache!
      const i = playerCell.i + dI;
      const j = playerCell.j + dJ;
      if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
        createCache({ i, j });
      }
    }
  }
}

function clearRectangles() {
  map.eachLayer(function (layer: leaflet.Layer) {
    if (layer instanceof leaflet.Rectangle) {
      map.removeLayer(layer);
    }
  });
}

const movementButtons = document.createElement("div");
movementButtons.style.textAlign = "center";
app.append(movementButtons);
createMovementButton("⬆️", 1, 0);
createMovementButton("⬇️", -1, 0);
createMovementButton("⬅️", 0, -1);
createMovementButton("➡️", 0, 1);

function createMovementButton(text: string, xChange: number, yChange: number) {
  const button = document.createElement("button");
  button.innerHTML = text;
  button.addEventListener("click", () => {
    playerLocation.lat += xChange * DEGREES_PER_TILE;
    playerLocation.lng += yChange * DEGREES_PER_TILE;
    bus.dispatchEvent(new Event("player-moved"));
  });
  movementButtons.append(button);
}

bus.addEventListener("player-moved", () => {
  playerMarker.setLatLng(playerLocation);
  map.panTo(playerLocation);
  clearRectangles();
  createCellsAroundPlayer();
});

createCellsAroundPlayer();
