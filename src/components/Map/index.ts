import dynamic from "next/dynamic";

// exporting a dynamic import resolves render flashes on load
export default dynamic(() => import("./MapWithContent"), {
  ssr: false,
});
