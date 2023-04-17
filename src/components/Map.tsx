import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet from "leaflet";
import { GeoJSON } from "leaflet";

import { useEffect } from "react";
import useRealtime from "@/hooks/useRealtime";

// Testdata
import { lineString } from "@/testdata/lineString";
import { getStopTime } from "@/testdata/stoptimes";
import { stops } from "@/testdata/stops";

// const TEST_TRIP_ID = "3249_11284";
const TEST_TRIP_ID = "3249_32029";
// Necessary because Leaflet uses northing-easting [[lat-lng]]
// while GeoJSON stores easting-northing [[long, lat]]

const coordinates = GeoJSON.coordsToLatLngs(lineString);

function Map() {
  const { realtimeTrips, isError, isLoading } = useRealtime();
  // Fix leaflet icons not importing
  useEffect(() => {
    (async function init() {
      // @ts-ignore
      delete Leaflet.Icon.Default.prototype._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "leaflet/images/marker-icon-2x.png",
        iconUrl: "leaflet/images/marker-icon.png",
        shadowUrl: "leaflet/images/marker-shadow.png",
      });
    })();
  }, []);

  useEffect(() => {
    console.log(realtimeTrips.get(TEST_TRIP_ID));
  }, [realtimeTrips]);

  return (
    <MapContainer
      center={[51.9081690653422, -8.41944955885327]}
      zoom={13}
      className="relative h-[100vmin] w-[100max]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stops?.map(({ stop_id, stop_code, stop_lat, stop_lon }) => {
        const stopTime = getStopTime(stop_id);

        if (!stop_lat || !stop_lon) {
          return [];
        }

        // set icons this way...

        // let iconUrl = "/images/tree-marker-icon.png";
        // let iconRetinaUrl = "/images/tree-marker-icon-2x.png";

        // if ( santaWasHere ) {
        //   iconUrl = '/images/gift-marker-icon.png';
        //   iconRetinaUrl = '/images/gift-marker-icon-2x.png';
        // }

        return (
          <Marker
            key={stop_id}
            position={[stop_lat, stop_lon]}
            // icon={Leaflet.icon({
            //   iconUrl,
            //   iconRetinaUrl,
            //   iconSize: [41, 41],
            // })}
          >
            <Popup>
              {/* <strong>Location:</strong> {city}, {region} */}
              <br />
              <strong>Stop Code: {stop_code}</strong>
              <br />
              <strong>Arrives:</strong> @ {stopTime?.arrival_time}
              {/* <strong>Departure:</strong> { arrivalDate.toDateString() } @ { departureTime } */}
            </Popup>
          </Marker>
        );
      })}
      <Polyline pathOptions={{ color: "firebrick" }} positions={coordinates} />
    </MapContainer>
  );
}

export default Map;
