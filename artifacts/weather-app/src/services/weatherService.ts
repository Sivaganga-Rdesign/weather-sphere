import axios from "axios";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

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
  aqi: number;      // 1–5
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

function precise(n: number) {
  return Math.round(n * 10) / 10;
}

function handleApiError(e: any) {
  if (e?.response?.status === 401) throw new Error("__INVALID_API_KEY__");
  throw e;
}

function mapWeather(data: any): WeatherData {
  const dt = data.dt;
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;
  // Add timezone offset to get local time at that location
  const localNow = dt + data.timezone;
  const localSunrise = sunrise + data.timezone;
  const localSunset = sunset + data.timezone;
  const isDay = localNow >= localSunrise && localNow <= localSunset;

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
    windSpeed: precise(data.wind.speed * 3.6),
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
    timezone: data.timezone,
    isDay,
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

export async function fetchWeatherByCity(city: string): Promise<{ weather: WeatherData; airQuality: AirQuality | null }> {
  const res = await axios
    .get(`${BASE_URL}/weather`, { params: { q: city, appid: API_KEY, units: "metric" } })
    .catch(handleApiError);
  const weather = mapWeather(res.data);
  const airQuality = await fetchAirQuality(weather.lat, weather.lon);
  return { weather, airQuality };
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<{ weather: WeatherData; airQuality: AirQuality | null }> {
  const res = await axios
    .get(`${BASE_URL}/weather`, { params: { lat, lon, appid: API_KEY, units: "metric" } })
    .catch(handleApiError);
  const weather = mapWeather(res.data);
  const airQuality = await fetchAirQuality(lat, lon);
  return { weather, airQuality };
}

export async function fetchForecast(city: string): Promise<{ daily: ForecastDay[]; hourly: HourlyPoint[] }> {
  const res = await axios
    .get(`${BASE_URL}/forecast`, { params: { q: city, appid: API_KEY, units: "metric", cnt: 40 } })
    .catch(handleApiError);
  return mapForecastData(res.data);
}

export async function fetchForecastByCoords(lat: number, lon: number): Promise<{ daily: ForecastDay[]; hourly: HourlyPoint[] }> {
  const res = await axios
    .get(`${BASE_URL}/forecast`, { params: { lat, lon, appid: API_KEY, units: "metric", cnt: 40 } })
    .catch(handleApiError);
  return mapForecastData(res.data);
}
