import { Icon } from "leaflet";

type Color =
  | "blue"
  | "gold"
  | "red"
  | "green"
  | "orange"
  | "yellow"
  | "violet"
  | "grey"
  | "black";

export function stopMarkerIcon({
  isUpcoming,
  isCurrent = false,
  isTripSelected,
}: {
  isUpcoming: boolean;
  isCurrent: boolean;
  isTripSelected: boolean;
}) {
  const color = isCurrent
    ? "blue"
    : !isTripSelected
      ? "blue"
      : isUpcoming
        ? "green"
        : "grey";
  return new Icon({
    iconUrl: new URL(`
    data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 54 62'%3E
    %3Cg clip-path='url(%23a)'%3E%3Cpath fill='${color}' d='M6.0489.007C2.1768.007 0 2.3013 0 6.9895v48.3288C0 59.7034 1.957 62 5.826 62h42.3454C52.0403 62 54 59.8183 54 55.3184V6.9897c0-4.574-1.9597-6.9829-5.9504-6.9829 0 0-42.0137-.0153-42.0006 0L6.0489.007Z'/%3E
    %3Cpath fill='white' d='M27.2652 9.3997c-4.0776 0-9.7093 1.165-12.0404 2.1355-2.33.9715-3.8841 1.9421-4.3693 4.3704L9.1079 29.3633v18.5432h3.0098v2.9085c0 3.5458 5.189 3.5458 5.189 0v-2.9085h19.5685v2.9085c0 3.5458 5.189 3.5458 5.189 0v-2.9085h3.0098V29.3633l-1.7476-13.4577c-.4852-2.4283-2.0393-3.3989-4.3693-4.3704-2.3311-.9705-7.9628-2.1355-12.0414-2.1355'/%3E
    %3Cpath fill='${color}' d='M39.4676 42.0937c1.3748 0 2.4892-1.1144 2.4892-2.4891s-1.1144-2.4891-2.4892-2.4891c-1.3747 0-2.4891 1.1144-2.4891 2.4891s1.1144 2.4891 2.4891 2.4891Zm-24.7534 0c-1.3747 0-2.4891-1.1144-2.4891-2.4891s1.1144-2.4891 2.4891-2.4891c1.3748 0 2.4891 1.1144 2.4891 2.4891s-1.1143 2.4891-2.4891 2.4891Zm12.1843-27.1109h-7.207c-1.4568 0-1.4568-2.1852 0-2.1852h14.7989c1.4558 0 1.4558 2.1852 0 2.1852h-7.5919Zm0 2.2054H15.7648c-1.5389 0-1.94.7821-2.1275 1.9684l-1.3605 9.761c-.1266.935.1438 1.864 1.4365 1.864h26.7553c1.2916 0 1.5631-.929 1.4355-1.864l-1.3596-9.761c-.1874-1.1863-.5896-1.9684-2.1274-1.9684H26.8985Z'/%3E
    %3C/g%3E%3Cdefs%3E%3CclipPath id='a'%3E%3Crect width='54' height='62' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E`)
      .href,
    shadowUrl: "",
    iconSize: isCurrent ? [40, 48] : [24, 30],
    iconAnchor: [14, 14],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}
