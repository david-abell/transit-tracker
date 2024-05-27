export type Changelog = {
  version: string;
  changes: string[];
  title?: string;
};
export const changelogs: Changelog[] = [
  {
    version: "0.12.0",
    title: "Feature: Changelog dialog.",
    changes: [
      "Add Shadcn dialog component.",
      "Add changelog component and recent changes.",
    ],
  },
  {
    version: "0.11.2",
    changes: [
      "Fix dynamic map tiles url causing duplicate image caching.",
      "Fix security policy causing cached map tiles to use way too much storage space.",
      "Fix chrome service worker bug causing significant slowdown when ignoring url search params with many images cached.",
    ],
  },
  {
    version: "0.11.1",
    changes: [
      "Fix z-index inconsistencies in footer, global alerts, saved stops, and drawer/sheet ui components.",
    ],
  },
  {
    version: "0.11.0",
    title:
      "Feature: change footer from accordion to mobile friendly drawer component.",
    changes: [
      "Add shadcn drawer component.",
      "Adjust global muted color style.",
    ],
  },
  {
    version: "0.10.0",
    title: "Feature: support installation as progressive web app (PWA).",
    changes: [
      "High resolution icons for android and iOS.",
      "Cache map tiles for for reduced network bandwidth.",
      "Skip animations when changing map location.",
      "Adjust zoom level that displays vehicle markers.",
    ],
  },
];
