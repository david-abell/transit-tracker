import { useEffect, useRef, useState } from "react";
import { useMap, CircleMarker, Circle, LayerGroup } from "react-leaflet";
import { Locate } from "lucide-react";
import LeafletControl from "./LeafletControl";
import { Button } from "../ui/button";
import { LocationEvent } from "leaflet";
import { cn } from "@/lib/utils";

type Props = { className?: string };

function UserLocation({ className = "" }: Props) {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [radius, setRadius] = useState(0);
  const prevLocation = useRef<L.LatLng | null>();

  // Watch current user location
  useEffect(() => {
    const handleSetLocation = (e: LocationEvent) => {
      if (
        !prevLocation.current ||
        e.latlng.lat !== prevLocation.current.lat ||
        e.latlng.lng !== prevLocation.current.lng
      ) {
        prevLocation.current = userLocation;
        setUserLocation(e.latlng);
        setRadius(e.accuracy);
      }
    };

    map
      .locate({
        watch: true,
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 15_000,
      })
      .on("locationerror", (e) => console.error(e))
      .on("locationfound", (e) => handleSetLocation(e));

    return () => {
      map.stopLocate();
      map.off("locationfound", handleSetLocation);
      map.off("locationerror");
    };
  }, [map, userLocation]);

  return (
    <LeafletControl position={"bottomright"}>
      <Button
        onClick={() => {
          if (userLocation) {
            map.setView(userLocation, 14);
          }
        }}
        size={"icon"}
        className={cn(className, "mb-4 mr-2 lg:mb-10 lg:mr-10")}
      >
        <Locate />
      </Button>
      <LayerGroup>
        {!!userLocation && (
          <>
            {radius > 100 && (
              <Circle
                center={userLocation}
                radius={radius}
                stroke={false}
                fillOpacity={0.2}
              />
            )}
            <CircleMarker
              center={userLocation}
              radius={6}
              color="white"
              stroke
              weight={2}
              fillColor="#1869E5"
              fillOpacity={1}
            />
          </>
        )}
      </LayerGroup>
    </LeafletControl>
  );
}

export default UserLocation;
