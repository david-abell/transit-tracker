export type Changelog = {
  version: string;
  changes: string[];
  title?: string;
};
export const changelogs: Changelog[] = [
  {
    version: "0.14.2",
    changes: [
      "fix: don't query nearby vehicles api when nearby vehicle layer is disabled.",
    ],
  },
  {
    version: "0.14.1",
    changes: [
      "Possible fix for vehicleUpdates api throwing error when it shouldn't.",
    ],
  },
  {
    version: "0.14.0",
    changes: [
      "Add hint that nearby buses do not load at low zoom levels.",
      "Add home screen suggestion to select a nearby bus.",
    ],
  },
  {
    version: "0.13.2",
    title: "Better stop popup.",
    changes: [
      "fix: last stop on trip should not be selectable as a pickup location.",
      "fix: replace popup time calculations with single global value for better consistency and performance.",
      "style: reduce overall stop popup size by lowering text content top/bottom margins.",
    ],
  },
  {
    version: "0.13.1",
    title: "Drawer time fixes.",
    changes: [
      "fix: wrong arrival times in drawer elements caused by not matching stops with correct stoptime updates.",
      "fix: drawer header incorrectly showing time to arrival instead of time to pickup when the next stop is the pickup stop.",
    ],
  },
  {
    version: "0.13.0",
    title: "Feature: Drawer timeline and status rework.",
    changes: [
      "Cleaned up bottom drawer header and live status text.",
      "Add prominent 'next stop' to bottom drawer header.",
      "Rework bottom drawer content with new Trip Timeline.",
      "Replaced vaul drawer with vladyoslav/drawer.",
      "Add more time and data helper utilities in preparation for state management rework.",
      "Updated map centering logic should cause less unintended map movement.",
      "Fix: require minimum zoom level to load nearby vehicles. Prevents cluttering map with too many objects.",
      "fix: disable spyderified stop clusters that misbehave at high zoom levels.",
      "fix: handle rare cases where stops do no have NTA defined stop code such as 200 Cobh cork city service.",
      "fix: search input styles not showing current focus.",
      "fix: LiveText sometimes not inline with text.",
      "fix: saved stops missing gap after star icons on small screen sizes.",
    ],
  },
  {
    version: "0.12.1",
    changes: ["Style: visual consistency of nav-item buttons and links."],
  },
  {
    version: "0.12.0",
    title: "Feature: Changelog dialog.",
    changes: [
      "Add Shadcn dialog component.",
      "Add changelog component and recent app updates.",
    ],
  },
  {
    version: "0.11.2",
    changes: [
      "Fix: dynamic map tiles url causing duplicate image caching.",
      "Fix: security policy causing cached map tiles to use way too much storage space.",
      "Fix: chrome service worker bug causing significant slowdown when ignoring url search params with many images cached.",
    ],
  },
  {
    version: "0.11.1",
    changes: [
      "Fix: z-index inconsistencies in footer, global alerts, saved stops, and drawer/sheet ui components.",
    ],
  },
  {
    version: "0.11.0",
    title:
      "Feature: change footer from accordion to mobile friendly drawer component.",
    changes: [
      "Add shadcn drawer component.",
      "Style: adjust global muted color variable.",
    ],
  },
  {
    version: "0.10.0",
    title: "Feature: support installation as progressive web app (PWA).",
    changes: [
      "Add high resolution icons for android and iOS.",
      "Cache map tiles for for reduced network bandwidth.",
      "Style: skip animations when changing map location.",
      "fix: adjust zoom level that displays vehicle markers.",
    ],
  },
];
