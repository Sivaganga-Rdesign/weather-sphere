import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "./components/SearchBar";
import WeatherCard from "./components/WeatherCard";
import Forecast from "./components/Forecast";
import HourlyChart from "./components/HourlyChart";
import WeatherDetails from "./components/WeatherDetails";
import WeatherAlerts from "./components/WeatherAlerts";
import QuickSummaryBar from "./components/QuickSummaryBar";
import HourlyStrip from "./components/HourlyStrip";
import Loader from "./components/Loader";
import EmptyState from "./components/EmptyState";
import Background3D from "./components/Background3D";
import { useWeather } from "./hooks/useWeather";
import { getWeatherCondition, WeatherCondition } from "./services/weatherService";

const CONDITION_ICON: Record<WeatherCondition, { day: string; night: string }> = {
  clear:        { day: "☀️",  night: "🌙" },
  clouds:       { day: "⛅",  night: "☁️" },
  rain:         { day: "🌧",  night: "🌧" },
  snow:         { day: "❄️",  night: "❄️" },
  thunderstorm: { day: "⚡",  night: "⚡" },
  mist:         { day: "🌫",  night: "🌫" },
  default:      { day: "🌤",  night: "🌙" },
};

function getLocalIsDay() {
  const h = new Date().getHours();
  return h >= 6 && h < 19;
}

export default function App() {
  const {
    weather, forecast, hourly, airQuality,
    loading, error,
    searchCity, detectLocation, getSuggestions,
  } = useWeather();

  const [condition, setCondition] = useState<WeatherCondition>("default");
  const [isDay, setIsDay] = useState(getLocalIsDay);

  useEffect(() => {
    if (weather) setCondition(getWeatherCondition(weather.condition));
  }, [weather]);

  // Flip day/night automatically every minute based on user's local clock
  useEffect(() => {
    const id = setInterval(() => setIsDay(getLocalIsDay()), 60_000);
    return () => clearInterval(id);
  }, []);

  const headerIcon = CONDITION_ICON[condition]?.[isDay ? "day" : "night"] ?? "🌤";

  return (
    <div className="min-h-screen text-white relative">
      <Background3D condition={condition} isDay={isDay} temp={weather?.temp ?? 22} />

      {/* Dark gradient veil behind header so text stays readable on bright sky */}
      <div className="fixed inset-x-0 top-0 h-44 pointer-events-none z-[5]"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.10) 70%, transparent 100%)" }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-8 pb-3 px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-5"
            >
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Weather</h1>
                <p className="text-white/30 text-xs">
                  {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <motion.div
                key={`${condition}-${isDay}`}
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-base"
              >
                {headerIcon}
              </motion.div>
            </motion.div>

            <SearchBar
              onSearch={searchCity}
              onLocate={detectLocation}
              loading={loading}
              getSuggestions={getSuggestions}
            />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 md:px-8 pb-10">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-4 mt-2 px-4 py-3 rounded-2xl bg-red-500/15 border border-red-400/20 text-red-200 text-sm leading-relaxed"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {loading && <Loader />}
            {!loading && !weather && !error && <EmptyState onLocate={detectLocation} />}

            <AnimatePresence mode="wait">
              {!loading && weather && (
                <motion.div
                  key={weather.city}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-3 mt-2"
                >
                  {/* Sticky summary bar */}
                  <QuickSummaryBar weather={weather} forecast={forecast} />

                  <WeatherCard weather={weather} condition={condition} />
                  <WeatherAlerts weather={weather} condition={condition} airQuality={airQuality} forecast={forecast} />
                  <WeatherDetails weather={weather} condition={condition} airQuality={airQuality} />
                  {hourly.length > 0 && <HourlyStrip hourly={hourly} />}
                  {hourly.length > 0 && forecast.length > 0 && <HourlyChart hourly={hourly} forecast={forecast} />}
                  {forecast.length > 0 && <Forecast forecast={forecast} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="px-4 pb-4 text-center">
          <p className="text-white/20 text-xs">Powered by OpenWeatherMap</p>
        </footer>
      </div>
    </div>
  );
}
