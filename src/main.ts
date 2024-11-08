// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import "./leafletWorkaround.ts";

import "leaflet/dist/leaflet.css";
import "./style.css";

import luck from "./luck.ts";

import { Cell, Coin, GeoRect, LatLng } from "./interfaces.ts";

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
      lat: playerLocation.lat + i * TILE_DEGREES, // changed from MAIN_Location to playerlocation
      lng: playerLocation.lng + j * TILE_DEGREES,
    },
    bottomRight: {
      lat: playerLocation.lat + (i + 1) * TILE_DEGREES,
      lng: playerLocation.lng + (j + 1) * TILE_DEGREES,
    },
  };
}

function createCell(i: number, j: number) {
  const bounds = getRectForCell(i, j);
  const rect = leaflet.rectangle([
    [bounds.topLeft.lat, bounds.topLeft.lng],
    [bounds.bottomRight.lat, bounds.bottomRight.lng],
  ]);

  const inventory: Coin[] = [];
  for (
    let i = 0;
    i < Math.floor(luck([i, j, "initialValue"].toString()) * 10);
    i++
  ) {
    inventory.push({
      i: Math.round(bounds.topLeft.lat / TILE_DEGREES),
      j: Math.round(bounds.topLeft.lng / TILE_DEGREES),
      serial: i,
    });
  }
  const cell = { i: i, j: j, inventory: inventory };

  rect.addTo(map);
  rect.bindPopup(() => {
    const popup = document.createElement("div");
    popup.innerHTML = `${Math.round(bounds.topLeft.lat / TILE_DEGREES)}, ${
      Math.round(bounds.topLeft.lng / TILE_DEGREES)
    }<br>`;
    const takeDiv = document.createElement("div");
    if (cell.inventory.length > 0) {
      takeDiv.innerHTML += `<div>TAKE</div>`;
      displayTakeCoins(cell, takeDiv);
    }
    popup.append(takeDiv);
    const giveDiv = document.createElement("div");
    if (playerCoins.length > 0) {
      giveDiv.innerHTML += `<div>GIVE</div>`;
      displayGiveCoins(cell, giveDiv);
    }
    popup.append(giveDiv);
    return popup;
  });
}

function collect(cell: Cell, coin: Coin) { // takes coin and gives to player
  if (cell.inventory.length > 0) {
    playerCoins.push(coin);
    const index = cell.inventory.indexOf(coin);
    cell.inventory.splice(index, 1);
    updateInventoryText();
  }
}
function deposit(cell: Cell, coin: Coin) { // takes coin and gives to cell
  if (playerCoins.length > 0) {
    cell.inventory.push(coin);
    const index = playerCoins.indexOf(coin);
    playerCoins.splice(index, 1);
    updateInventoryText();
  }
}

function displayTakeCoins(cell: Cell, div: HTMLDivElement) {
  for (let x = 0; x < cell.inventory.length; x++) {
    const buttonDiv = document.createElement("div");
    const button = document.createElement("button");
    button.innerHTML = `take`;
    buttonDiv.append(button);
    button.addEventListener("click", () => {
      collect(cell, cell.inventory[x]);
      updateTakeCoinDiv(cell, div);
    });
    buttonDiv.append(
      `${cell.inventory[x].i}:${cell.inventory[x].j}#${
        cell.inventory[x].serial
      }`,
    );
    div.append(buttonDiv);
  }
}

function displayGiveCoins(cell: Cell, div: HTMLDivElement) {
  for (let x = 0; x < playerCoins.length; x++) {
    const buttonDiv = document.createElement("div");
    const button = document.createElement("button");
    button.innerHTML = `give`;
    buttonDiv.append(button);
    button.addEventListener("click", () => {
      deposit(cell, playerCoins[x]);
      updateGiveCoinDiv(cell, div);
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

function updateTakeCoinDiv(cell: Cell, div: HTMLDivElement) {
  div.innerHTML = ``;
  if (cell.inventory.length > 0) {
    div.innerHTML += `<div>TAKE</div>`;
    displayTakeCoins(cell, div);
  }
}

function updateGiveCoinDiv(cell: Cell, div: HTMLDivElement) {
  div.innerHTML = ``;
  if (playerCoins.length > 0) {
    div.innerHTML += `<div>GIVE</div>`;
    displayGiveCoins(cell, div);
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
    createCellsAroundPlayer();
  });
  movementButtons.append(button);
}

const cellList: LatLng[] = [];
function createCellsAroundPlayer() {
  const NEIGHBORHOOD_SIZE = 3;
  const CACHE_SPAWN_PROBABILITY = 0.05;
  for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      // If location i,j is lucky enough, spawn a cache!
      if (
        luck([i * playerLocation.lat, j * playerLocation.lng].toString()) <
          CACHE_SPAWN_PROBABILITY && validPosition(i, j)
      ) {
        createCell(i, j);
        cellList.push({ lat: i, lng: j });
      }
    }
  }
}

function validPosition(i: number, j: number) {
  for (let x = 0; x < cellList.length; x++) {
    if (cellList[x].lat == i && cellList[x].lng == j) {
      return false;
    }
  }
  return true;
}

createCellsAroundPlayer();
