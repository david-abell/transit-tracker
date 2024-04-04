import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import "@/styles/globals.css";
import "@/styles/leaflet.css";
import "@/styles/markerCluster.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouterReady } from "@/hooks/useRouterReady";

export default function App({ Component, pageProps }: AppProps) {
  const isRouterReady = useRouterReady();
  return (
    <ErrorBoundary>
      <Head>
        <title>Irish Bus tracker</title>
        <meta property="og:title" content="Irish Bus tracker" key="title" />
      </Head>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {isRouterReady ? <Component {...pageProps} /> : null}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
