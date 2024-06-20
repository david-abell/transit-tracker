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
            variant={"ghost"}
            size={"icon"}
            className="absolute right-0 top-0 p-0 pointer-events-auto"
            onClick={() => setRequestHide(true)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">close</span>
          </Button>
          <AlertDescription>
            <p className="font-bold">Hint:</p>
            <p>New nearby buses do not load while zoomed out.</p>
            <p>
              They can also be hidden entirely with the map layer controls
              located upper right.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

export default ZoomHint;
