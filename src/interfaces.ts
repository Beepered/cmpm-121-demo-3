export interface Coin {
  i: number;
  j: number;
  serial: number;
}

export interface Cell {
  lat: number;
  lng: number;
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
