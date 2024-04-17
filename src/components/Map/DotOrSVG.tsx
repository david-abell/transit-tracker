import { Icon } from "leaflet";
import { ReactNode } from "react";
import { CircleMarker, Marker } from "react-leaflet";
// import { canvasRenderer } from ".";

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
      // renderer={canvasRenderer}
    >
      {children}
    </CircleMarker>
  );
}

export default DotOrSVG;

const FONT_FAMILY =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
const BG_COLOR = "%23f9fafb";

function getIcon(textContent: string, color: string) {
  return new Icon({
    iconUrl:
      new URL(`data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' fill='${BG_COLOR}' xmlns='http://www.w3.org/2000/svg'%3E
    %3Cpath x='0' y='0' stroke='${color}' stroke-width='1' d='M6.69811 0.5H46C47.3807 0.5 48.5 1.61929 48.5 3V23C48.5 24.3807 47.3807 25.5 46 25.5H6.69811C5.3174 25.5 4.19811 24.3807 4.19811 23V18.1743C4.19811 17.2935 3.86601 16.4451 3.26807 15.7983L2.25 14.6971C1.36424 13.7391 1.36424 12.2609 2.25 11.3029L3.26807 10.2017C3.86601 9.55493 4.19811 8.7065 4.19811 7.82569V3C4.19811 1.61929 5.3174 0.5 6.69811 0.5Z'/%3E
    %3Ctext x='50%25' y='55%25' fill='${color}' font-family='${FONT_FAMILY}' font-size='13' font-weight='bold' dominant-baseline='middle' text-anchor='middle' %3E${textContent}%3C/text%3E%3C/svg%3E%0A`)
        .href,
    // shadowUrl: gpsShadow,
    iconSize: [52, 26],
    iconAnchor: [26, 14],
    popupAnchor: [1, -34],
    // shadowSize: [54, 28],
  });
}
