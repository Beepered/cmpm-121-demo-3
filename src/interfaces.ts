export interface Coin {
  i: number;
  j: number;
  serial: number;
}

export interface Cell {
  i: number;
  j: number;
  inventory: Coin[];
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoRect {
  topLeft: LatLng;
  bottomRight: LatLng;
}
