import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "./components/SearchBar";
import WeatherCard from "./components/WeatherCard";
import Forecast from "./components/Forecast";
import HourlyChart from "./components/HourlyChart";
import WeatherDetails from "./components/WeatherDetails";
import Loader from "./components/Loader";
import EmptyState from "./components/EmptyState";
import Background3D from "./components/Background3D";
import { useWeather } from "./hooks/useWeather";
import { getWeatherCondition, WeatherCondition } from "./services/weatherService";

const CONDITION_EMOJI: Record<WeatherCondition, string> = {
  clear: "☀️", clouds: "☁️", rain: "🌧", snow: "❄️",
  thunderstorm: "⚡", mist: "🌫", default: "🌤",
};

export default function App() {
  const { weather, forecast, hourly, loading, error, searchCity, detectLocation } = useWeather();
  const [condition, setCondition] = useState<WeatherCondition>("default");

  useEffect(() => {
    if (weather) setCondition(getWeatherCondition(weather.condition));
  }, [weather]);

  return (
    <div className="min-h-screen text-white relative">
      <Background3D condition={condition} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-8 pb-4 px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Weather</h1>
                <p className="text-white/30 text-xs">
                  {new Date().toLocaleDateString([], {
                    weekday: "long", month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
              <motion.div
                key={condition}
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-base"
              >
                {CONDITION_EMOJI[condition]}
              </motion.div>
            </motion.div>

            <SearchBar onSearch={searchCity} onLocate={detectLocation} loading={loading} />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 md:px-8 pb-10">
          <div className="max-w-2xl mx-auto">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-4 mt-2 px-4 py-3 rounded-2xl bg-red-500/15 border border-red-400/20 text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading */}
            {loading && <Loader />}

            {/* Empty state */}
            {!loading && !weather && !error && (
              <EmptyState onLocate={detectLocation} />
            )}

            {/* Weather data */}
            <AnimatePresence mode="wait">
              {!loading && weather && (
                <motion.div
                  key={weather.city}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-4 mt-2"
                >
                  <WeatherCard weather={weather} condition={condition} />
                  <WeatherDetails weather={weather} condition={condition} />
                  {hourly.length > 0 && forecast.length > 0 && (
                    <HourlyChart hourly={hourly} forecast={forecast} />
                  )}
                  {forecast.length > 0 && <Forecast forecast={forecast} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-4 pb-4 text-center">
          <p className="text-white/20 text-xs">Powered by OpenWeatherMap</p>
        </footer>
      </div>
    </div>
  );
}
