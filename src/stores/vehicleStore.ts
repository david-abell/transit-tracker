import { NTAVehicleUpdate } from "@/pages/api/gtfs/vehicle-updates";

let listeners: any[] = [];

type VehicleStore = Map<string, NTAVehicleUpdate>;

const store = new Map<string, NTAVehicleUpdate>();

export const vehicleStore = {
  getVehicles() {
    return store;
  },

  add(vehicle: NTAVehicleUpdate | NTAVehicleUpdate[]) {
    if (Array.isArray(vehicle)) {
      vehicle.forEach((v) => store.set(v.vehicle.id, v));
    } else {
      store.set(vehicle.vehicle.id, vehicle);
    }

    emitChange();
  },

  subscribe(listener: any) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

function emitChange() {
  for (let listener of listeners) {
    listener();
  }
}
