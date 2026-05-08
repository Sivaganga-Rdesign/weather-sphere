import axios from "axios";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

export interface WeatherData {
  city: string;
  country: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  windGust: number;
  pressure: number;
  visibility: number;
  condition: string;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  clouds: number;
  dt: number;
  timezone: number;
  isDay: boolean;
}

export interface GeoResult {
  name: string;
  localNames?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface ForecastDay {
  date: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pop: number;
}

export interface HourlyPoint {
  time: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  pop: number;
}

export interface AirQuality {
  aqi: number;
  label: string;
  co: number;
  no2: number;
  o3: number;
  pm2_5: number;
  pm10: number;
}

export type WeatherCondition =
  | "clear" | "clouds" | "rain" | "snow"
  | "thunderstorm" | "mist" | "default";

export function getWeatherCondition(main: string): WeatherCondition {
  const m = main.toLowerCase();
  if (m === "clear") return "clear";
  if (m === "clouds") return "clouds";
  if (m === "rain" || m === "drizzle") return "rain";
  if (m === "snow") return "snow";
  if (m === "thunderstorm") return "thunderstorm";
  if (m === "mist" || m === "fog" || m === "haze" || m === "smoke" || m === "dust") return "mist";
  return "default";
}

function precise(n: number) { return Math.round(n * 10) / 10; }

function handleApiError(e: any, city?: string) {
  if (e?.response?.status === 401) throw new Error("__INVALID_API_KEY__");
  if (e?.response?.status === 404) throw new Error(city ? `__NOT_FOUND__:${city}` : "__NOT_FOUND__");
  throw e;
}

function mapWeather(data: any): WeatherData {
  const dt = data.dt;
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;
  const tz = data.timezone;
  const localNow = dt + tz;
  const localSunrise = sunrise + tz;
  const localSunset = sunset + tz;

  return {
    city: data.name,
    country: data.sys.country,
    lat: data.coord.lat,
    lon: data.coord.lon,
    temp: precise(data.main.temp),
    feelsLike: precise(data.main.feels_like),
    tempMin: precise(data.main.temp_min),
    tempMax: precise(data.main.temp_max),
    humidity: data.main.humidity,
    windSpeed: precise((data.wind.speed ?? 0) * 3.6),
    windDeg: data.wind.deg ?? 0,
    windGust: precise((data.wind.gust ?? 0) * 3.6),
    pressure: data.main.pressure,
    visibility: precise((data.visibility ?? 10000) / 1000),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    sunrise,
    sunset,
    clouds: data.clouds?.all ?? 0,
    dt,
    timezone: tz,
    isDay: localNow >= localSunrise && localNow <= localSunset,
  };
}

function mapForecastData(data: any): { daily: ForecastDay[]; hourly: HourlyPoint[] } {
  const hourly: HourlyPoint[] = data.list.slice(0, 8).map((item: any) => ({
    time: item.dt,
    temp: precise(item.main.temp),
    feelsLike: precise(item.main.feels_like),
    humidity: item.main.humidity,
    windSpeed: precise(item.wind.speed * 3.6),
    condition: item.weather[0].main,
    icon: item.weather[0].icon,
    pop: Math.round((item.pop ?? 0) * 100),
  }));

  const dailyMap = new Map<string, any[]>();
  for (const item of data.list) {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyMap.has(date)) dailyMap.set(date, []);
    dailyMap.get(date)!.push(item);
  }
  const daily: ForecastDay[] = [];
  let count = 0;
  for (const [, items] of dailyMap) {
    if (count >= 5) break;
    const temps = items.map((i: any) => i.main.temp);
    const mid = items[Math.floor(items.length / 2)];
    daily.push({
      date: mid.dt,
      tempMin: precise(Math.min(...temps)),
      tempMax: precise(Math.max(...temps)),
      condition: mid.weather[0].main,
      description: mid.weather[0].description,
      icon: mid.weather[0].icon,
      humidity: mid.main.humidity,
      windSpeed: precise(mid.wind.speed * 3.6),
      pop: Math.round((mid.pop ?? 0) * 100),
    });
    count++;
  }
  return { daily, hourly };
}

const AQI_LABELS = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"];

async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality | null> {
  try {
    const res = await axios.get(`${BASE_URL}/air_pollution`, {
      params: { lat, lon, appid: API_KEY },
    });
    const { main, components } = res.data.list[0];
    return {
      aqi: main.aqi,
      label: AQI_LABELS[main.aqi] ?? "Unknown",
      co: precise(components.co),
      no2: precise(components.no2),
      o3: precise(components.o3),
      pm2_5: precise(components.pm2_5),
      pm10: precise(components.pm10),
    };
  } catch {
    return null;
  }
}

/* ─── Geocoding ────────────────────────────────────────────────────────── */

/* ─── Nominatim (OpenStreetMap) fallback — covers villages OWM misses ── */

function nominatimToGeoResult(r: any): GeoResult {
  const addr = r.address ?? {};
  return {
    name: addr.village || addr.suburb || addr.town || addr.city || r.display_name.split(",")[0].trim(),
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    country: (addr.country_code ?? "").toUpperCase(),
    state: addr.state,
  };
}

async function nominatimSearch(query: string, limit = 5): Promise<GeoResult[]> {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: query, format: "json", limit, addressdetails: 1 },
      headers: { "User-Agent": "WeatherApp/1.0" },
      timeout: 6000,
    });
    return (res.data ?? []).map(nominatimToGeoResult);
  } catch {
    return [];
  }
}

/** Find matching locations for a query string (used for autocomplete).
 *  Tries OWM geocoding first; falls back to Nominatim for villages. */
export async function geocodeSearch(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await axios.get(`${GEO_URL}/direct`, {
      params: { q: query, limit: 5, appid: API_KEY },
    });
    if ((res.data?.length ?? 0) > 0) return res.data as GeoResult[];
  } catch { /* fall through */ }

  // OWM returned nothing — try Nominatim (much better village/rural coverage)
  return nominatimSearch(query, 5);
}

/**
 * Resolve a city name to coordinates.
 * Strategy:
 *   1. OWM geocoding with the raw query
 *   2. OWM geocoding with ",IN" appended (helps for Indian place names)
 *   3. Nominatim raw query
 *   4. Nominatim with ",India" appended
 */
async function geocodeCity(query: string): Promise<GeoResult | null> {
  // ── OWM attempts ──────────────────────────────────────────────────────
  const owmAttempts = [query];
  if (!query.includes(",")) owmAttempts.push(`${query},IN`);

  for (const attempt of owmAttempts) {
    try {
      const res = await axios.get(`${GEO_URL}/direct`, {
        params: { q: attempt, limit: 1, appid: API_KEY },
      });
      if (res.data?.length > 0) return res.data[0];
    } catch { /* continue */ }
  }

  // ── Nominatim fallback (villages, hamlets, rural areas) ───────────────
  const nomAttempts = [query];
  if (!query.toLowerCase().includes("india") && !query.includes(",")) {
    nomAttempts.push(`${query}, India`);
  }
  for (const attempt of nomAttempts) {
    const results = await nominatimSearch(attempt, 1);
    if (results.length > 0) return results[0];
  }

  return null;
}

/* ─── IP-based geolocation fallback ───────────────────────────────────── */

export interface IpLocation {
  lat: number;
  lon: number;
  city: string;
}

export async function getLocationByIp(): Promise<IpLocation | null> {
  try {
    const res = await axios.get("https://ipapi.co/json/", { timeout: 5000 });
    const { latitude, longitude, city } = res.data;
    if (latitude && longitude) {
      return { lat: latitude, lon: longitude, city: city ?? "Your Location" };
    }
    return null;
  } catch {
    try {
      // Second fallback: ip-api.com
      const res2 = await axios.get("http://ip-api.com/json/", { timeout: 5000 });
      const { lat, lon, city } = res2.data;
      if (lat && lon) return { lat, lon, city: city ?? "Your Location" };
      return null;
    } catch {
      return null;
    }
  }
}

/* ─── Public fetch functions ───────────────────────────────────────────── */

export async function fetchWeatherByCity(city: string): Promise<{ weather: WeatherData; airQuality: AirQuality | null }> {
  // First geocode to lat/lon — handles small villages, partial names, etc.
  const geo = await geocodeCity(city);
  if (!geo) {
    // Provide a helpful error with suggestions if we have any
    throw new Error(`__NOT_FOUND__:${city}`);
  }

  // Fetch weather by coordinates (always succeeds if coords are valid)
  const res = await axios
    .get(`${BASE_URL}/weather`, { params: { lat: geo.lat, lon: geo.lon, appid: API_KEY, units: "metric" } })
    .catch((e) => handleApiError(e, city));
  const weather = mapWeather(res.data);
  // Override city name with the geocoded name (more accurate for villages)
  weather.city = geo.name;
  weather.country = geo.country;

  const airQuality = await fetchAirQuality(geo.lat, geo.lon);
  return { weather, airQuality };
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<{ weather: WeatherData; airQuality: AirQuality | null }> {
  const res = await axios
    .get(`${BASE_URL}/weather`, { params: { lat, lon, appid: API_KEY, units: "metric" } })
    .catch((e) => handleApiError(e));
  const weather = mapWeather(res.data);
  const airQuality = await fetchAirQuality(lat, lon);
  return { weather, airQuality };
}

export async function fetchForecast(lat: number, lon: number): Promise<{ daily: ForecastDay[]; hourly: HourlyPoint[] }> {
  const res = await axios
    .get(`${BASE_URL}/forecast`, { params: { lat, lon, appid: API_KEY, units: "metric", cnt: 40 } })
    .catch((e) => handleApiError(e));
  return mapForecastData(res.data);
}
