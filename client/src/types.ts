export interface Vendor {
  id: number;
  name: string;
}

export interface Sensor {
  id: number;
  name: string;
  type: string;
  location: string;
  lastReading?: number;
  lastReadingUnit?: string;
}

export interface WastePoint {
  id: number;
  process_step: string;
  wasteType: string;
  estimatedVolume: number;
  unit: string;
  vendor: string;
  notes?: string;
  interval: string;
  locationData?: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  };
  deviceId?: number;
  organizationId?: number;
  createdAt: string;
  updatedAt: string;
  sensor?: {
    id: number;
    name: string;
    type: string;
    location: string;
    lastReading?: number;
    lastReadingUnit?: string;
  } | null;
}

export interface WastePointFormData {
  processStep: string;
  wasteType: string;
  estimatedVolume: number;
  unit: string;
  vendor: string;
  notes?: string;
  interval: string;
  locationData?: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  };
}

export interface Device {
  id: number;
  name: string;
  type: string;
  waste_point_id?: number;
  device_token?: string;
  organizationId?: number;
  createdAt: string;
  updatedAt: string;
} 