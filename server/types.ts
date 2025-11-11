export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
}

export interface SensorData {
  name: string;
  type: string;
  location?: string;
  lastUpdate?: string;
  status?: 'active' | 'inactive' | 'error';
  connectionStatus?: 'connected' | 'disconnected';
  batteryLevel?: number;
  readings?: {
    [key: string]: number | string;
  };
}