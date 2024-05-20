import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload database */}
        <link
          rel="preload"
          href="/api/gtfs/static/stops/8220B1351201"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link rel="icon" type="image/svg+xml" href="/manifest/favicon.svg" />
        <link rel="icon" type="image/png" href="/manifest/favicon.png" />
        <link rel="icon" href="/manifest/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/manifest/apple-touch-icon.png" />
        <link rel="mask-icon" href="/icons/mask-icon.svg" color="#1e293b" />
        <link rel="manifest" href="/manifest/manifest.json" />
        <meta name="theme-color" content="#1e293b" />
        <meta
          name="description"
          content="View bus schedules, stops, and track realtime vehicle positions across Ireland."
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
