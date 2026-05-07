import { useState, useCallback } from "react";
import {
  fetchWeatherByCity,
  fetchWeatherByCoords,
  fetchForecast,
  fetchForecastByCoords,
  WeatherData,
  ForecastDay,
  HourlyPoint,
  AirQuality,
} from "../services/weatherService";

const RECENT_KEY = "weather_recent_searches";

export function useRecentSearches() {
  const get = (): string[] => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
    catch { return []; }
  };
  const add = (city: string) => {
    const prev = get().filter((c) => c.toLowerCase() !== city.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify([city, ...prev].slice(0, 5)));
  };
  return { get, add };
}

export interface WeatherState {
  weather: WeatherData | null;
  forecast: ForecastDay[];
  hourly: HourlyPoint[];
  airQuality: AirQuality | null;
  loading: boolean;
  error: string | null;
  searchCity: (city: string) => Promise<void>;
  detectLocation: () => void;
}

function errorMsg(e: any, city?: string): string {
  if (e?.message === "__INVALID_API_KEY__" || e?.response?.status === 401)
    return "API key invalid or not yet active. New OpenWeather keys can take up to 2 hours to activate.";
  if (e?.response?.status === 404)
    return city ? `City "${city}" not found. Please check the spelling.` : "Location not found.";
  return "Failed to fetch weather. Please try again.";
}

export function useWeather(): WeatherState {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recent = useRecentSearches();

  const searchCity = useCallback(async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const [{ weather: w, airQuality: aq }, fc] = await Promise.all([
        fetchWeatherByCity(city),
        fetchForecast(city),
      ]);
      setWeather(w);
      setAirQuality(aq);
      setForecast(fc.daily);
      setHourly(fc.hourly);
      recent.add(w.city);
    } catch (e: any) {
      setError(errorMsg(e, city));
    } finally {
      setLoading(false);
    }
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const [{ weather: w, airQuality: aq }, fc] = await Promise.all([
            fetchWeatherByCoords(lat, lon),
            fetchForecastByCoords(lat, lon),
          ]);
          setWeather(w);
          setAirQuality(aq);
          setForecast(fc.daily);
          setHourly(fc.hourly);
          recent.add(w.city);
        } catch (e: any) {
          setError(errorMsg(e));
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access denied. Please search by city name.");
        setLoading(false);
      }
    );
  }, []);

  return { weather, forecast, hourly, airQuality, loading, error, searchCity, detectLocation };
}
