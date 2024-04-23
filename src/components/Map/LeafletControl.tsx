import L from "leaflet";
import React, { ReactNode, useEffect, useRef } from "react";

const POSITION_CLASSES = {
  bottomleft: "leaflet-bottom leaflet-left",
  bottomright: "leaflet-bottom leaflet-right",
  topleft: "leaflet-top leaflet-left",
  topright: "leaflet-top leaflet-right",
};

type ControlPosition = keyof typeof POSITION_CLASSES;
interface LeafLetControlProps {
  position?: ControlPosition;
  children: ReactNode;
}

const LeafletControl: React.FC<LeafLetControlProps> = ({
  position,
  children,
}) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (divRef.current) {
      L.DomEvent.disableClickPropagation(divRef.current);
      L.DomEvent.disableScrollPropagation(divRef.current);
    }
  });

  return (
    <div ref={divRef} className={position && POSITION_CLASSES[position]}>
      <div className={"leaflet-control"}>{children}</div>
    </div>
  );
};

export default LeafletControl;
