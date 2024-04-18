import { Icon } from "leaflet";
import { ReactNode } from "react";
import { CircleMarker, Marker } from "react-leaflet";

type Props = {
  color: string;
  position: [number, number];
  textContent: string;
  zoom: number;
  children: ReactNode;
};

function DotOrSVG({ children, color, position, textContent, zoom }: Props) {
  if (zoom > 14) {
    return (
      <Marker position={position} icon={getIcon(textContent, color)}>
        {children}
      </Marker>
    );
  }
  return (
    <CircleMarker
      center={position}
      fill
      fillOpacity={100}
      fillColor={color}
      stroke={false}
      radius={6}
    >
      {children}
    </CircleMarker>
  );
}

export default DotOrSVG;

const FONT_FAMILY =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
// const BG_COLOR = "%23f9fafb";
// const BORDER_COLOR = "green";

function getIcon(textContent: string, color: string) {
  return new Icon({
    iconUrl: new URL(
      `data:image/svg+xml,%3Csvg width='60' height='30' viewBox='0 0 60 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M46.473 20.761a4.391 4.391 0 1 0-.002 8.783 4.391 4.391 0 0 0 .002-8.783Zm-2.408 4.39a2.407 2.407 0 1 1 4.814 0 2.407 2.407 0 0 1-4.814 0ZM12.634 20.761a4.391 4.391 0 1 0-.002 8.783 4.391 4.391 0 0 0 .002-8.783Zm-2.408 4.39a2.407 2.407 0 1 1 4.814 0 2.407 2.407 0 0 1-4.814 0Z' fill='${color}'/%3E%3Cmask id='a' fill='white'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M58.932 21.472c.119-4.032.084-7.52-.12-10.42-.207-2.935-.587-5.285-1.15-7.008-.507-1.548-1.157-2.443-2.055-2.961-.886-.511-1.965-.625-3.36-.625h-39.05c-1.233 0-2.391.017-3.527.185C8.517.815 7.4 1.14 6.28 1.757a5.663 5.663 0 0 0-1.74 1.503C2.686 5.608 2.69 7.605 1.985 10.701A55.982 55.982 0 0 0 1 16.186l.002 5.676c.095 1.68.81 2.649 1.878 3.207 1.016.532 2.333.657 3.718.676 15.856 0 28.038 0 47.745-.002 0 0 2.3-.474 3.084-1.158.793-.693 1.308-1.69 1.5-3.04l.005-.073Z'/%3E%3C/mask%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M58.932 21.472c.119-4.032.084-7.52-.12-10.42-.207-2.935-.587-5.285-1.15-7.008-.507-1.548-1.157-2.443-2.055-2.961-.886-.511-1.965-.625-3.36-.625h-39.05c-1.233 0-2.391.017-3.527.185C8.517.815 7.4 1.14 6.28 1.757a5.663 5.663 0 0 0-1.74 1.503C2.686 5.608 2.69 7.605 1.985 10.701A55.982 55.982 0 0 0 1 16.186l.002 5.676c.095 1.68.81 2.649 1.878 3.207 1.016.532 2.333.657 3.718.676 15.856 0 28.038 0 47.745-.002 0 0 2.3-.474 3.084-1.158.793-.693 1.308-1.69 1.5-3.04l.005-.073Z' fill='white' stroke='${color}' stroke-width='6' mask='url(%23a)'/%3E%3Cpath d='M0 0h60v30H0z'/%3E
      %3Ctext fill='black' xml:space='preserve' font-family='${FONT_FAMILY}' font-size='16' font-weight='bold' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E${textContent}%3C/text%3E%3C/svg%3E`,
    ).href,
    // shadowUrl: gpsShadow,
    iconSize: [55, 25],
    iconAnchor: [27.5, 12.5],
    popupAnchor: [1, -34],
    // shadowSize: [54, 28],
  });
}
