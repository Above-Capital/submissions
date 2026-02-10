import { DayPoint, HourPoint, Location, WeatherBundle, WeatherNow } from "./types";

export async function geocode(query: string): Promise<Location[]> {
  const q = query.trim();
  if (!q) return [];
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  const results = (data?.results ?? []) as any[];
  return results.map((r) => ({
    id: `geo_${r.id ?? r.name}_${r.latitude}_${r.longitude}`,
    name: String(r.name),
    country: r.country,
    admin1: r.admin1,
    lat: Number(r.latitude),
    lon: Number(r.longitude),
    tz: String(r.timezone || "auto"),
  }));
}

export async function getWeather(loc: Location): Promise<WeatherBundle> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(loc.lat));
  url.searchParams.set("longitude", String(loc.lon));
  url.searchParams.set("timezone", loc.tz || "auto");
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "relative_humidity_2m",
      "precipitation",
      "cloud_cover",
    ].join(",")
  );
  url.searchParams.set(
    "hourly",
    ["temperature_2m", "precipitation", "weather_code"].join(",")
  );
  url.searchParams.set(
    "daily",
    ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "weather_code"].join(",")
  );
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("weather_fetch_failed");
  const data = await res.json();

  const cur = data.current;
  const now: WeatherNow = {
    time: String(cur.time),
    tempC: Number(cur.temperature_2m),
    apparentC: Number(cur.apparent_temperature),
    windKph: Number(cur.wind_speed_10m),
    windDir: Number(cur.wind_direction_10m),
    humidity: cur.relative_humidity_2m == null ? null : Number(cur.relative_humidity_2m),
    precipMm: cur.precipitation == null ? null : Number(cur.precipitation),
    cloudCover: cur.cloud_cover == null ? null : Number(cur.cloud_cover),
    code: Number(cur.weather_code),
    isDay: Number(cur.is_day) === 1,
  };

  const hourly: HourPoint[] = [];
  const ht: string[] = data.hourly.time;
  const htemp: number[] = data.hourly.temperature_2m;
  const hprec: number[] = data.hourly.precipitation;
  const hcode: number[] = data.hourly.weather_code;
  for (let i = 0; i < ht.length; i++) {
    hourly.push({
      time: ht[i],
      tempC: Number(htemp[i]),
      precipMm: Number(hprec[i]),
      code: Number(hcode[i]),
    });
  }

  const daily: DayPoint[] = [];
  const dt: string[] = data.daily.time;
  const dmax: number[] = data.daily.temperature_2m_max;
  const dmin: number[] = data.daily.temperature_2m_min;
  const dprec: number[] = data.daily.precipitation_sum;
  const dcode: number[] = data.daily.weather_code;
  for (let i = 0; i < dt.length; i++) {
    daily.push({
      date: dt[i],
      tMaxC: Number(dmax[i]),
      tMinC: Number(dmin[i]),
      precipMm: Number(dprec[i]),
      code: Number(dcode[i]),
    });
  }

  return { now, hourly, daily };
}
