import { useState, useCallback } from "react";
import {
  fetchWeatherByCity,
  fetchWeatherByCoords,
  fetchForecast,
  fetchForecastByCoords,
  WeatherData,
  ForecastDay,
  HourlyPoint,
} from "../services/weatherService";

const RECENT_KEY = "weather_recent_searches";

export function useRecentSearches() {
  const get = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    } catch {
      return [];
    }
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
  loading: boolean;
  error: string | null;
  searchCity: (city: string) => Promise<void>;
  detectLocation: () => void;
}

export function useWeather(): WeatherState {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recent = useRecentSearches();

  const searchCity = useCallback(async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const [w, fc] = await Promise.all([fetchWeatherByCity(city), fetchForecast(city)]);
      setWeather(w);
      setForecast(fc.daily);
      setHourly(fc.hourly);
      recent.add(w.city);
    } catch (e: any) {
      const msg =
        e?.message === "__INVALID_API_KEY__" || e?.response?.status === 401
          ? "API key invalid or not yet active. New OpenWeather keys can take up to 2 hours to activate."
          : e?.response?.status === 404
          ? `City "${city}" not found. Please check the spelling.`
          : "Failed to fetch weather. Please try again.";
      setError(msg);
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
          const [w, fc] = await Promise.all([
            fetchWeatherByCoords(lat, lon),
            fetchForecastByCoords(lat, lon),
          ]);
          setWeather(w);
          setForecast(fc.daily);
          setHourly(fc.hourly);
          recent.add(w.city);
        } catch {
          setError("Failed to fetch weather for your location.");
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

  return { weather, forecast, hourly, loading, error, searchCity, detectLocation };
}
