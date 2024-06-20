import { useState } from "react";
import { useMap } from "react-leaflet";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { MIN_ZOOM_FOR_REQUEST } from "@/hooks/useVehicleUpdates";
import { X } from "lucide-react";

type Props = {
  show: boolean;
};

function ZoomHint({ show }: Props) {
  const [requestHide, setRequestHide] = useState(false);
  const map = useMap();

  const zoom = map.getZoom();

  if (!show || requestHide || zoom >= MIN_ZOOM_FOR_REQUEST) {
    return null;
  }

  return (
    <div
      className={
        "leaflet-top leaflet-left !ml-0 !top-0 !left-0  h-full w-full grid place-items-center"
      }
    >
      <div>
        <Alert className=" mx-auto bg-background/80 border-none">
          <Button
            size={"icon"}
            variant={"ghost"}
            className="absolute top-0 right-0  p-0.5 pointer-events-auto"
            onClick={() => setRequestHide(true)}
          >
            <X className="" />
          </Button>
          <AlertDescription>
            <p className="font-bold">Hint:</p>
            <p>Nearby buses only load when zoomed far enough in.</p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

export default ZoomHint;
