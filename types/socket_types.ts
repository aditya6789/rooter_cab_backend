// types/socket_types.ts
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export interface Location {
  latitude: number;
  longitude: number;
}

export type CustomSocket = Socket & {
  app?: any;
  location?: Location;
  driverId?: string;
};

export interface AuthSocket
  extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
  user?: string;
}
