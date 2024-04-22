import React, { memo } from "react";
import {
  extendContext,
  createElementObject,
  createPathComponent,
  LeafletContextInterface,
} from "@react-leaflet/core";
import L, { LeafletMouseEventHandlerFn } from "leaflet";
import "leaflet.markercluster";
import isEqual from "react-fast-compare";

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL(`
  data:image/svg+xml,%0A%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='blue' d='M3 1 2 2v8h.66s.1 1 .8 1c.7 0 .79-1 .79-1h3.5s.11 1 .78 1c.82 0 .81-1 .81-1H10V2L9 1zm1 1h4v1H4zM3 4h6v3H3zm0 4h1v1H3zm5 0h1v1H8z'/%3E%3C/svg%3E`)
    .href,
  shadowUrl: "",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type ClusterType = { [key in string]: any };

type ClusterEvents = {
  onClick?: LeafletMouseEventHandlerFn;
  onDblClick?: LeafletMouseEventHandlerFn;
  onMouseDown?: LeafletMouseEventHandlerFn;
  onMouseUp?: LeafletMouseEventHandlerFn;
  onMouseOver?: LeafletMouseEventHandlerFn;
  onMouseOut?: LeafletMouseEventHandlerFn;
  onContextMenu?: LeafletMouseEventHandlerFn;
};

type MarkerClusterControl = L.MarkerClusterGroupOptions & {
  children: React.ReactNode;
} & ClusterEvents;

function getPropsAndEvents(props: MarkerClusterControl) {
  let clusterProps: ClusterType = {};
  let clusterEvents: ClusterType = {};
  const { children, ...rest } = props;
  // Splitting props and events to different objects
  Object.entries(rest).forEach(([propName, prop]) => {
    if (propName.startsWith("on")) {
      clusterEvents[propName] = prop;
    } else {
      clusterProps[propName] = prop;
    }
  });
  return { clusterProps, clusterEvents };
}

function createMarkerClusterGroup(
  props: MarkerClusterControl,
  context: LeafletContextInterface,
) {
  const { clusterProps, clusterEvents } = getPropsAndEvents(props);
  const markerClusterGroup = new L.MarkerClusterGroup(clusterProps);
  Object.entries(clusterEvents).forEach(([eventAsProp, callback]) => {
    const clusterEvent = `cluster${eventAsProp.substring(2).toLowerCase()}`;
    markerClusterGroup.on(clusterEvent, callback);
  });
  return createElementObject(
    markerClusterGroup,
    extendContext(context, { layerContainer: markerClusterGroup }),
  );
}

const updateMarkerCluster = (
  instance: L.MarkerClusterGroup,
  props: MarkerClusterControl,
  prevProps: MarkerClusterControl,
) => {
  //TODO when prop change update instance
  //   if (props. !== prevProps.center || props.size !== prevProps.size) {
  //   instance.setBounds(getBounds(props))
  // }
};

const MarkerClusterGroup = memo(
  createPathComponent<L.MarkerClusterGroup, MarkerClusterControl>(
    createMarkerClusterGroup,
    updateMarkerCluster,
  ),
  isEqual,
);

export default MarkerClusterGroup;
