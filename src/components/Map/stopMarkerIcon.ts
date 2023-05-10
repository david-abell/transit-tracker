import { Icon } from "leaflet";

type Color =
  | "blue"
  | "gold"
  | "red"
  | "green"
  | "orange"
  | "yellow"
  | "violet"
  | "grey"
  | "black";

export function stopMarkerIcon(isUpcoming: boolean, isCurrent = false) {
  return new Icon({
    iconUrl: new URL(`
    data:image/svg+xml,%0A%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='${
      isUpcoming ? "green" : "gray"
    }' d='M3 1 2 2v8h.66s.1 1 .8 1c.7 0 .79-1 .79-1h3.5s.11 1 .78 1c.82 0 .81-1 .81-1H10V2L9 1zm1 1h4v1H4zM3 4h6v3H3zm0 4h1v1H3zm5 0h1v1H8z'/%3E%3C/svg%3E`)
      .href,
    shadowUrl: "",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}
