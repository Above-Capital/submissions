export type ThemeMode = "system" | "light" | "dark";

export type Location = {
  id: string;
  name: string;
  country?: string;
  admin1?: string;
  lat: number;
  lon: number;
  tz: string;
};

export type WeatherNow = {
  time: string;
  tempC: number;
  apparentC: number;
  windKph: number;
  windDir: number;
  humidity: number | null;
  precipMm: number | null;
  cloudCover: number | null;
  code: number;
  isDay: boolean;
};

export type HourPoint = {
  time: string;
  tempC: number;
  precipMm: number;
  code: number;
};

export type DayPoint = {
  date: string;
  tMaxC: number;
  tMinC: number;
  precipMm: number;
  code: number;
};

export type WeatherBundle = {
  now: WeatherNow;
  hourly: HourPoint[];
  daily: DayPoint[];
};
