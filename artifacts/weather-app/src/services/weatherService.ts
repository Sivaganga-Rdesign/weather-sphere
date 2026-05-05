import axios from "axios";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  pressure: number;
  visibility: number;
  condition: string;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  clouds: number;
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

export type WeatherCondition = "clear" | "clouds" | "rain" | "snow" | "thunderstorm" | "mist" | "default";

export function getWeatherCondition(main: string): WeatherCondition {
  const m = main.toLowerCase();
  if (m === "clear") return "clear";
  if (m === "clouds") return "clouds";
  if (m === "rain" || m === "drizzle") return "rain";
  if (m === "snow") return "snow";
  if (m === "thunderstorm") return "thunderstorm";
  if (m === "mist" || m === "fog" || m === "haze") return "mist";
  return "default";
}

function handleApiError(e: any) {
  if (e?.response?.status === 401) throw new Error("__INVALID_API_KEY__");
  throw e;
}

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const res = await axios
    .get(`${BASE_URL}/weather`, { params: { q: city, appid: API_KEY, units: "metric" } })
    .catch(handleApiError);
  return mapWeather(res.data);
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const res = await axios
    .get(`${BASE_URL}/weather`, { params: { lat, lon, appid: API_KEY, units: "metric" } })
    .catch(handleApiError);
  return mapWeather(res.data);
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

function mapWeather(data: any): WeatherData {
  return {
    city: data.name,
    country: data.sys.country,
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6),
    windDeg: data.wind.deg ?? 0,
    pressure: data.main.pressure,
    visibility: Math.round((data.visibility ?? 10000) / 1000),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    clouds: data.clouds?.all ?? 0,
  };
}

function mapForecastData(data: any): { daily: ForecastDay[]; hourly: HourlyPoint[] } {
  const hourly: HourlyPoint[] = data.list.slice(0, 8).map((item: any) => ({
    time: item.dt,
    temp: Math.round(item.main.temp),
    feelsLike: Math.round(item.main.feels_like),
    humidity: item.main.humidity,
    windSpeed: Math.round(item.wind.speed * 3.6),
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
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      condition: mid.weather[0].main,
      description: mid.weather[0].description,
      icon: mid.weather[0].icon,
      humidity: mid.main.humidity,
      windSpeed: Math.round(mid.wind.speed * 3.6),
      pop: Math.round((mid.pop ?? 0) * 100),
    });
    count++;
  }
  return { daily, hourly };
}
