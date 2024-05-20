import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  Serwist,
  ExpirationPlugin,
  CacheableResponsePlugin,
  disableDevLogs,
} from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

disableDevLogs();

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher({ request }) {
        return request.destination === "image";
      },
      handler: new CacheFirst({
        cacheName: "images",
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
        matchOptions: { ignoreSearch: true },
      }),
    },
  ],
});

serwist.addEventListeners();
