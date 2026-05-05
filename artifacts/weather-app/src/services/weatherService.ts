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
  condition: string;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
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

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const res = await axios.get(`${BASE_URL}/weather`, {
    params: { q: city, appid: API_KEY, units: "metric" },
  }).catch((e) => {
    if (e?.response?.status === 401) {
      throw new Error("__INVALID_API_KEY__");
    }
    throw e;
  });
  return mapWeather(res.data);
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const res = await axios.get(`${BASE_URL}/weather`, {
    params: { lat, lon, appid: API_KEY, units: "metric" },
  });
  return mapWeather(res.data);
}

export async function fetchForecast(city: string): Promise<ForecastDay[]> {
  const res = await axios.get(`${BASE_URL}/forecast`, {
    params: { q: city, appid: API_KEY, units: "metric", cnt: 40 },
  });
  return mapForecast(res.data);
}

export async function fetchForecastByCoords(lat: number, lon: number): Promise<ForecastDay[]> {
  const res = await axios.get(`${BASE_URL}/forecast`, {
    params: { lat, lon, appid: API_KEY, units: "metric", cnt: 40 },
  });
  return mapForecast(res.data);
}

function mapWeather(data: any): WeatherData {
  return {
    city: data.name,
    country: data.sys.country,
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
  };
}

function mapForecast(data: any): ForecastDay[] {
  const dailyMap = new Map<string, any[]>();
  for (const item of data.list) {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyMap.has(date)) dailyMap.set(date, []);
    dailyMap.get(date)!.push(item);
  }
  const days: ForecastDay[] = [];
  let count = 0;
  for (const [, items] of dailyMap) {
    if (count >= 5) break;
    const temps = items.map((i: any) => i.main.temp);
    const mid = items[Math.floor(items.length / 2)];
    days.push({
      date: mid.dt,
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      condition: mid.weather[0].main,
      description: mid.weather[0].description,
      icon: mid.weather[0].icon,
      humidity: mid.main.humidity,
      windSpeed: Math.round(mid.wind.speed * 3.6),
    });
    count++;
  }
  return days;
}
