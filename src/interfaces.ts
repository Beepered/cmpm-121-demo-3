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

export interface NewCache { // inventory
  inventory: Coin[];
}
