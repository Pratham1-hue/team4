export type FlightStatus =
  | "scheduled"
  | "on_time"
  | "boarding"
  | "departed"
  | "in_air"
  | "landed"
  | "delayed"
  | "cancelled";

export interface AirportInfo {
  code: string;
  name: string;
  city: string;
  country: string;
  terminal: string;
  gate: string;
  lat: number;
  lng: number;
  scheduledTime: string;
  actualTime?: string;
  estimatedTime?: string;
  baggageClaim?: string;
  weather?: {
    temp: number;
    condition: string;
    windSpeed: number;
    visibility: number;
    rainProb: number;
    alertMessage?: string;
    riskLevel: "normal" | "advisory" | "severe";
  };
}

export interface FlightInfo {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  aircraftType?: string;
  date: string;
  origin: AirportInfo;
  destination: AirportInfo;
  status: FlightStatus;
  delayMinutes: number;
  duration: string;
  progressPercent: number; // 0 - 100
  lastUpdated: string;
  tripId?: string;
  sourceTicketId?: string;
}

export type TrainStatus = "on_time" | "delayed" | "running" | "arrived" | "cancelled";

export interface TrainStation {
  code: string;
  name: string;
  platform: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayMinutes: number;
  passed: boolean;
}

export interface TrainInfo {
  id: string;
  trainNumber: string;
  trainName: string;
  pnr?: string;
  date: string;
  origin: {
    code: string;
    name: string;
    platform: string;
    departureTime: string;
  };
  destination: {
    code: string;
    name: string;
    platform: string;
    arrivalTime: string;
  };
  currentLocation?: {
    stationName: string;
    stationCode: string;
    speedKmH: number;
    delayMinutes: number;
    status: TrainStatus;
  };
  stations: TrainStation[];
  coaches: string[];
  lastUpdated: string;
  weatherAlert?: {
    condition: string;
    temp: number;
    alert?: string;
  };
}

