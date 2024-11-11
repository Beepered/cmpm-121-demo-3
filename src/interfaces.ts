// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import "./leafletWorkaround.ts";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoRect {
  topLeft: LatLng;
  bottomRight: LatLng;
}

export interface Coin {
  i: number;
  j: number;
  serial: number;
}

export interface Cell { // just the rectangle
  lat: number;
  lng: number;
  rect: leaflet.Rectangle;
}

export interface CoinCache { // inventory
  inventory: Coin[];
}

export interface CacheMemento {
  strMemento: string[];
}

export function coinToStr(coin: Coin): string {
  return coin.i.toString() + ":" + coin.j.toString() + "#" + coin.serial;
}

export function strToCoin(str: string): Coin {
  const i = parseInt(str.substring(0, str.indexOf(":")));
  const j = parseInt(str.substring(str.indexOf(":") + 1, str.indexOf("#")));
  const serial = parseInt(str.substring(str.indexOf("#") + 1));
  return { i: i, j: j, serial: serial };
}
