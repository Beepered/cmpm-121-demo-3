// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import "./leafletWorkaround.ts";

import "leaflet/dist/leaflet.css";
import "./style.css";

import luck from "./luck.ts";

import {
  CacheMemento,
  Cell,
  Coin,
  CoinCache,
  coinToStr,
  GeoRect,
  LatLng,
  strToCoin,
} from "./interfaces.ts";

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

let playerLocation = leaflet.latLng(MAIN_LOCATION);
const playerMarker = leaflet.marker(MAIN_LOCATION);
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

const TILE_DEGREES = 1e-4;
function getRectForCell(i: number, j: number): GeoRect {
  return {
    topLeft: {
      lat: playerLocation.lat + (i - 0.5) * TILE_DEGREES,
      lng: playerLocation.lng + (j - 0.5) * TILE_DEGREES,
    },
    bottomRight: {
      lat: playerLocation.lat + (i + 0.5) * TILE_DEGREES,
      lng: playerLocation.lng + (j + 0.5) * TILE_DEGREES,
    },
  };
}

function createCell(i: number, j: number): Cell {
  const bounds = getRectForCell(i, j);
  const rect = leaflet.rectangle([
    [bounds.topLeft.lat, bounds.topLeft.lng],
    [bounds.bottomRight.lat, bounds.bottomRight.lng],
  ]);
  rect.addTo(map);

  return {
    lat: playerLocation.lat + i * TILE_DEGREES,
    lng: playerLocation.lng + j * TILE_DEGREES,
    rect: rect,
  };
}

function createCache(cell: Cell, coins: Coin[] = []): CoinCache {
  let inventory: Coin[] = [];
  if (coins.length == 0) {
    for (
      let x = 0;
      x <
        Math.floor(luck([cell.lat, cell.lng, "initialValue"].toString()) * 10);
      x++
    ) {
      inventory.push({
        i: Math.round(cell.lat / TILE_DEGREES),
        j: Math.round(cell.lng / TILE_DEGREES),
        serial: x,
      });
    }
  } else {
    inventory = coins;
  }

  const cache = { inventory: inventory };

  cell.rect.bindPopup(() => {
    const popup = document.createElement("div");
    popup.innerHTML = `${Math.round(cell.lat / TILE_DEGREES)}, ${
      Math.round(cell.lng / TILE_DEGREES)
    }<br>`;
    const takeDiv = document.createElement("div");
    if (cache.inventory.length > 0) {
      takeDiv.innerHTML += `<div>TAKE</div>`;
      displayTakeCoins(cache, takeDiv);
    }
    popup.append(takeDiv);
    const giveDiv = document.createElement("div");
    if (playerCoins.length > 0) {
      giveDiv.innerHTML += `<div>GIVE</div>`;
      displayGiveCoins(cache, giveDiv);
    }
    popup.append(giveDiv);
    return popup;
  });

  return cache;
}

function toCacheMemento(cache: CoinCache): string[] {
  const strList: string[] = [];
  for (let x = 0; x < cache.inventory.length; x++) {
    strList.push(coinToStr(cache.inventory[x]));
  }
  return strList;
}

function fromCacheMemento(strList: string[]): Coin[] {
  const coinList: Coin[] = [];
  for (let x = 0; x < coinList.length; x++) {
    coinList.push(strToCoin(strList[x]));
  }
  return coinList;
}

function collect(cache: CoinCache, coin: Coin) { // takes coin and gives to player
  if (cache.inventory.length > 0) {
    playerCoins.push(coin);
    const index = cache.inventory.indexOf(coin);
    cache.inventory.splice(index, 1);
    updateInventoryText();
  }
}
function deposit(cache: CoinCache, coin: Coin) { // takes coin and gives to cell
  if (playerCoins.length > 0) {
    cache.inventory.push(coin);
    const index = playerCoins.indexOf(coin);
    playerCoins.splice(index, 1);
    updateInventoryText();
  }
}

function displayTakeCoins(cache: CoinCache, div: HTMLDivElement) {
  for (let x = 0; x < cache.inventory.length; x++) {
    const buttonDiv = document.createElement("div");
    const button = document.createElement("button");
    button.innerHTML = `take`;
    buttonDiv.append(button);
    button.addEventListener("click", () => {
      collect(cache, cache.inventory[x]);
      updateTakeCoinDiv(cache, div);
    });
    buttonDiv.append(
      `${cache.inventory[x].i}:${cache.inventory[x].j}#${
        cache.inventory[x].serial
      }`,
    );
    div.append(buttonDiv);
  }
}

function displayGiveCoins(cache: CoinCache, div: HTMLDivElement) {
  for (let x = 0; x < playerCoins.length; x++) {
    const buttonDiv = document.createElement("div");
    const button = document.createElement("button");
    button.innerHTML = `give`;
    buttonDiv.append(button);
    button.addEventListener("click", () => {
      deposit(cache, playerCoins[x]);
      updateGiveCoinDiv(cache, div);
    });
    buttonDiv.append(
      `${playerCoins[x].i}:${playerCoins[x].j}#${playerCoins[x].serial}`,
    );
    div.append(buttonDiv);
  }
}

function updateInventoryText() {
  inventoryText.innerHTML = ``;
  for (let x = 0; x < playerCoins.length; x++) {
    inventoryText.innerHTML += `${playerCoins[x].i}:${playerCoins[x].j}#${
      playerCoins[x].serial
    }<br>`;
  }
}

function updateTakeCoinDiv(cache: CoinCache, div: HTMLDivElement) {
  div.innerHTML = ``;
  if (cache.inventory.length > 0) {
    div.innerHTML += `<div>TAKE</div>`;
    displayTakeCoins(cache, div);
  }
}

function updateGiveCoinDiv(cache: CoinCache, div: HTMLDivElement) {
  div.innerHTML = ``;
  if (playerCoins.length > 0) {
    div.innerHTML += `<div>GIVE</div>`;
    displayGiveCoins(cache, div);
  }
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
    playerLocation = leaflet.latLng(
      playerLocation.lat + xChange * TILE_DEGREES,
      playerLocation.lng + yChange * TILE_DEGREES,
    );
    playerMarker.setLatLng(playerLocation);
    map.panTo(playerLocation);

    clearRectangles();
    createCellsAroundPlayer();
  });
  movementButtons.append(button);
}

let rectList: leaflet.Rectangle[] = []; // store cells to delete rects from
const positionList: LatLng[] = [];
const cacheStrList: CacheMemento[] = [];
function createCellsAroundPlayer() {
  const NEIGHBORHOOD_SIZE = 4;
  const CACHE_SPAWN_PROBABILITY = 0.05;
  for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      // If location i,j is lucky enough, spawn a cache!
      const tryI = playerLocation.lat + i * TILE_DEGREES;
      const tryJ = playerLocation.lng + j * TILE_DEGREES;
      if (luck([tryI, tryJ].toString()) < CACHE_SPAWN_PROBABILITY) {
        const cell = createCell(i, j);
        rectList.push(cell.rect);
        if (freePosition(cell)) {
          positionList.push({ lat: cell.lat, lng: cell.lng });
          const cache = createCache(cell);
          cacheStrList.push({ strMemento: toCacheMemento(cache) });
        } else {
          createCache(
            cell,
            fromCacheMemento(cacheStrList[getCacheMemento(cell)].strMemento),
          );
        }
      }
    }
  }
}

function freePosition(cell: Cell) {
  for (let x = 0; x < positionList.length; x++) {
    if (cell.lat == positionList[x].lat && cell.lng == positionList[x].lng) {
      return false;
    }
  }
  return true;
}

function clearRectangles() {
  for (let x = 0; x < rectList.length; x++) {
    rectList[x].remove();
  }
  rectList = [];
}

function getCacheMemento(cell: Cell): number {
  let index = 0;
  for (let x = 0; x < positionList.length; x++) {
    if (cell.lat == positionList[x].lat && cell.lng == positionList[x].lng) {
      index = x;
    }
  }
  console.log(`index; ${index}`);
  return index;
}

createCellsAroundPlayer();
/*
let cell = createCell(0, 0);
rectList.push(cell.rect);
if (freePosition(cell)) {
  positionList.push({ lat: cell.lat, lng: cell.lng });
  const cache = createCache(cell);
  cacheStrList.push({ strMemento: toCacheMemento(cache) });
}

clearRectangles();

cell = createCell(0, 0);
rectList.push(cell.rect);
if (freePosition(cell)) {
  console.log("created cell again")
  positionList.push({ lat: cell.lat, lng: cell.lng });
  const cache = createCache(cell);
  cacheStrList.push({ strMemento: toCacheMemento(cache) });
}
else{
  console.log("cell exist")
  createCache(cell, fromCacheMemento(cacheStrList[getCacheMemento(cell)].strMemento))
}
  */
