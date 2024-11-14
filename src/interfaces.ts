export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoRect {
  topLeft: LatLng;
  bottomRight: LatLng;
}

export interface Cell {
  i: number;
  j: number;
}

export interface Coin {
  homeCell: Cell;
  serial: number;
}
