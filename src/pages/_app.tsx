import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/globals.css";
import "@/styles/leaflet.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
