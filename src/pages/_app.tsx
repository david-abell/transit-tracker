import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/globals.css";
import "@/styles/leaflet.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Head>
        <title>Irish Bus tracker</title>
        <meta property="og:title" content="Irish Bus tracker" key="title" />
      </Head>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
