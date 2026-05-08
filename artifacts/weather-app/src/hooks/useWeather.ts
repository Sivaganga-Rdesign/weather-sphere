import { useState, useCallback } from "react";
import {
  fetchWeatherByCity,
  fetchWeatherByCoords,
  fetchForecast,
  getLocationByIp,
  geocodeSearch,
  GeoResult,
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
  getSuggestions: (query: string) => Promise<GeoResult[]>;
}

function errorMsg(e: any, city?: string): string {
  const msg: string = e?.message ?? "";
  if (msg === "__INVALID_API_KEY__" || e?.response?.status === 401)
    return "API key invalid or not yet active. New OpenWeather keys can take up to 2 hours to activate.";
  if (msg.startsWith("__NOT_FOUND__")) {
    const name = msg.split(":")[1];
    return name
      ? `"${name}" wasn't found. Try adding a district or state — e.g. "Koproli, Maharashtra" or "Koproli, Raigad".`
      : "Location not found. Try adding a state or country name after a comma.";
  }
  return "Failed to fetch weather. Please check your connection and try again.";
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
      const { weather: w, airQuality: aq } = await fetchWeatherByCity(city);
      const fc = await fetchForecast(w.lat, w.lon);
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
    setLoading(true);
    setError(null);

    const fetchByCoords = async (lat: number, lon: number) => {
      const [{ weather: w, airQuality: aq }, fc] = await Promise.all([
        fetchWeatherByCoords(lat, lon),
        fetchForecast(lat, lon),
      ]);
      setWeather(w);
      setAirQuality(aq);
      setForecast(fc.daily);
      setHourly(fc.hourly);
      recent.add(w.city);
    };

    const tryIpFallback = async () => {
      const ipLoc = await getLocationByIp();
      if (ipLoc) {
        await fetchByCoords(ipLoc.lat, ipLoc.lon);
      } else {
        setError("Couldn't detect your location. Please search for your city manually.");
      }
    };

    if (!navigator.geolocation) {
      // No geolocation support at all — go straight to IP
      tryIpFallback().catch(() => {
        setError("Location detection failed. Please search by city name.");
      }).finally(() => setLoading(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await fetchByCoords(pos.coords.latitude, pos.coords.longitude);
        } catch (e: any) {
          setError(errorMsg(e));
        } finally {
          setLoading(false);
        }
      },
      async (err) => {
        // Permission denied or unavailable — fall back to IP silently
        try {
          if (err.code === 1 || err.code === 2) {
            // PERMISSION_DENIED or POSITION_UNAVAILABLE → try IP
            await tryIpFallback();
          } else {
            setError("Location timed out. Please search by city name.");
          }
        } catch {
          setError("Location detection failed. Please search by city name.");
        } finally {
          setLoading(false);
        }
      },
      { timeout: 6000, maximumAge: 60000 }
    );
  }, []);

  const getSuggestions = useCallback(async (query: string): Promise<GeoResult[]> => {
    if (query.trim().length < 2) return [];
    return geocodeSearch(query);
  }, []);

  return { weather, forecast, hourly, airQuality, loading, error, searchCity, detectLocation, getSuggestions };
}
