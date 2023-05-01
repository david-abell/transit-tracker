import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// exporting a dynamic import resolves render flashes on load
export default dynamic(() => import("./MapWithContent"), {
  ssr: false,
});
