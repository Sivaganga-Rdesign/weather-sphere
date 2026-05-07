import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, ShieldAlert, ChevronDown, ChevronUp, Bell } from "lucide-react";
import { WeatherData, WeatherCondition, AirQuality, ForecastDay } from "../services/weatherService";

export interface Alert {
  id: string;
  severity: "extreme" | "warning" | "advisory" | "watch";
  title: string;
  description: string;
  icon: string;
}

const SEVERITY_STYLES: Record<Alert["severity"], { bg: string; border: string; title: string; badge: string; badgeText: string; icon: React.ReactNode }> = {
  extreme:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",   title: "#fca5a5", badge: "rgba(239,68,68,0.25)",   badgeText: "#fca5a5", icon: <ShieldAlert className="w-4 h-4" /> },
  warning:  { bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.35)",  title: "#fdba74", badge: "rgba(249,115,22,0.25)",  badgeText: "#fdba74", icon: <AlertTriangle className="w-4 h-4" /> },
  advisory: { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.35)",   title: "#fde047", badge: "rgba(234,179,8,0.25)",   badgeText: "#fde047", icon: <AlertCircle className="w-4 h-4" /> },
  watch:    { bg: "rgba(96,165,250,0.12)",   border: "rgba(96,165,250,0.30)", title: "#93c5fd", badge: "rgba(96,165,250,0.22)",  badgeText: "#93c5fd", icon: <Info className="w-4 h-4" /> },
};

const SEVERITY_LABEL: Record<Alert["severity"], string> = {
  extreme: "Extreme",
  warning: "Warning",
  advisory: "Advisory",
  watch: "Watch",
};

const SEVERITY_ORDER: Alert["severity"][] = ["extreme", "warning", "advisory", "watch"];

export function generateAlerts(
  weather: WeatherData,
  condition: WeatherCondition,
  airQuality: AirQuality | null,
  forecast: ForecastDay[],
): Alert[] {
  const alerts: Alert[] = [];
  const { temp, feelsLike, windSpeed, windGust, visibility, humidity, pressure, isDay } = weather;

  // ── TEMPERATURE ────────────────────────────────────────────────────────────
  if (temp >= 45) {
    alerts.push({ id: "heat-extreme", severity: "extreme", icon: "🔥", title: "Extreme Heat Warning", description: `Temperature is ${Math.round(temp)}°C. Stay indoors, avoid physical activity, and drink water frequently. This temperature is life-threatening.` });
  } else if (temp >= 38 || feelsLike >= 40) {
    alerts.push({ id: "heat-warning", severity: "warning", icon: "🌡", title: "Heat Warning", description: `Temperature ${Math.round(temp)}°C (feels like ${Math.round(feelsLike)}°C). Limit outdoor activities during peak hours. Stay hydrated.` });
  } else if (temp >= 32 && humidity > 65) {
    alerts.push({ id: "heat-advisory", severity: "advisory", icon: "☀️", title: "Heat & Humidity Advisory", description: `High temperature with ${humidity}% humidity creates heat index well above ${Math.round(temp)}°C. Take frequent breaks in the shade.` });
  }

  if (temp <= -20) {
    alerts.push({ id: "cold-extreme", severity: "extreme", icon: "🧊", title: "Extreme Cold Warning", description: `Temperature is ${Math.round(temp)}°C. Risk of frostbite within minutes. Avoid outdoor exposure without full protective gear.` });
  } else if (temp <= -10 || feelsLike <= -15) {
    alerts.push({ id: "cold-warning", severity: "warning", icon: "❄️", title: "Severe Cold Warning", description: `Dangerous wind chill of ${Math.round(feelsLike)}°C. Cover all exposed skin when outdoors.` });
  } else if (temp <= 0) {
    alerts.push({ id: "freeze", severity: "advisory", icon: "🌨", title: "Freeze Advisory", description: `Freezing temperatures may cause ice on roads and footpaths. Drive carefully and watch for black ice.` });
  }

  // ── STORM ──────────────────────────────────────────────────────────────────
  if (condition === "thunderstorm") {
    alerts.push({ id: "thunderstorm", severity: "warning", icon: "⚡", title: "Thunderstorm Warning", description: "Active thunderstorm in your area. Stay indoors, avoid metal objects, trees, and open areas. Unplug sensitive electronics." });
  }

  // ── WIND ───────────────────────────────────────────────────────────────────
  if (windGust >= 90 || windSpeed >= 75) {
    alerts.push({ id: "wind-extreme", severity: "extreme", icon: "💨", title: "Severe Wind Warning", description: `Gusts up to ${Math.round(windGust)} km/h. Risk of structural damage and falling trees. Avoid travel if possible.` });
  } else if (windGust >= 60 || windSpeed >= 50) {
    alerts.push({ id: "wind-warning", severity: "warning", icon: "🌬", title: "High Wind Warning", description: `Gusts up to ${Math.round(windGust)} km/h. Secure loose outdoor items and drive with caution.` });
  } else if (windSpeed >= 35) {
    alerts.push({ id: "wind-advisory", severity: "advisory", icon: "💨", title: "Wind Advisory", description: `Sustained winds of ${Math.round(windSpeed)} km/h. Cyclists and pedestrians should take care.` });
  }

  // ── RAIN / FLOOD ───────────────────────────────────────────────────────────
  if (condition === "rain" && pressure < 995) {
    alerts.push({ id: "flood-watch", severity: "watch", icon: "🌊", title: "Flood Watch", description: "Sustained rainfall with low pressure may lead to flash flooding. Avoid low-lying areas and underpasses." });
  } else if (condition === "rain" && humidity > 90) {
    alerts.push({ id: "heavy-rain", severity: "advisory", icon: "🌧", title: "Heavy Rain Advisory", description: "Heavy rainfall expected. Reduce speed while driving and avoid flooded roads." });
  }

  // Check upcoming forecast for high rain probability
  const highRainForecast = forecast.filter(d => d.pop >= 70);
  if (highRainForecast.length >= 2 && condition !== "rain") {
    const days = highRainForecast.length;
    alerts.push({ id: "rain-forecast", severity: "watch", icon: "🌦", title: "Rain Likely Next Few Days", description: `${days} of the next ${forecast.length} days have over 70% chance of rain. Plan outdoor activities accordingly.` });
  }

  // ── SNOW ───────────────────────────────────────────────────────────────────
  if (condition === "snow" && temp <= -5) {
    alerts.push({ id: "blizzard-watch", severity: "warning", icon: "🌨", title: "Winter Storm Warning", description: "Heavy snowfall with freezing temperatures. Roads may be impassable. Travel only if necessary." });
  } else if (condition === "snow") {
    alerts.push({ id: "snow-advisory", severity: "advisory", icon: "❄️", title: "Snow Advisory", description: "Snowfall in progress. Roads may be slippery. Drive slowly and keep distance from other vehicles." });
  }

  // ── VISIBILITY / FOG ───────────────────────────────────────────────────────
  if (visibility < 0.5) {
    alerts.push({ id: "fog-extreme", severity: "warning", icon: "🌫", title: "Dense Fog Warning", description: `Visibility is critically low at ${visibility} km. Use fog lights and drive at very low speed.` });
  } else if (visibility < 2) {
    alerts.push({ id: "fog-advisory", severity: "advisory", icon: "🌫", title: "Fog Advisory", description: `Visibility reduced to ${visibility} km. Use headlights and increase following distance while driving.` });
  }

  // ── AIR QUALITY ────────────────────────────────────────────────────────────
  if (airQuality) {
    if (airQuality.aqi === 5) {
      alerts.push({ id: "aqi-extreme", severity: "extreme", icon: "😷", title: "Very Poor Air Quality", description: `AQI ${airQuality.aqi} (Very Poor). PM2.5: ${airQuality.pm2_5} μg/m³. Everyone should avoid all outdoor activities. Wear a high-grade mask if you must go outside.` });
    } else if (airQuality.aqi === 4) {
      alerts.push({ id: "aqi-poor", severity: "warning", icon: "😷", title: "Poor Air Quality Warning", description: `AQI ${airQuality.aqi} (Poor). PM2.5: ${airQuality.pm2_5} μg/m³. Sensitive groups should avoid outdoor exposure. Limit physical exertion outside.` });
    } else if (airQuality.aqi === 3) {
      alerts.push({ id: "aqi-moderate", severity: "advisory", icon: "⚠️", title: "Moderate Air Quality", description: `AQI ${airQuality.aqi} (Moderate). PM2.5: ${airQuality.pm2_5} μg/m³. Sensitive individuals (asthma, elderly, children) should reduce outdoor time.` });
    }
  }

  // ── HUMIDITY ───────────────────────────────────────────────────────────────
  if (humidity >= 90 && temp >= 28 && condition !== "rain" && condition !== "thunderstorm") {
    alerts.push({ id: "humidity", severity: "advisory", icon: "💧", title: "Extreme Humidity Advisory", description: `${humidity}% relative humidity at ${Math.round(temp)}°C makes conditions feel much hotter. Heat exhaustion risk is elevated.` });
  }

  // ── PRESSURE ───────────────────────────────────────────────────────────────
  if (pressure < 980) {
    alerts.push({ id: "pressure-low", severity: "watch", icon: "📉", title: "Very Low Pressure System", description: `Barometric pressure at ${pressure} hPa indicates a deep low-pressure system. Expect deteriorating conditions and strong gusts.` });
  }

  // ── UV (DAYTIME ONLY) ──────────────────────────────────────────────────────
  if (isDay && condition === "clear" && temp >= 28) {
    alerts.push({ id: "uv", severity: "advisory", icon: "☀️", title: "High UV Index", description: "Clear skies and warm temperatures suggest high UV exposure. Apply SPF 30+ sunscreen, wear protective clothing, and limit midday sun." });
  }

  // Sort: extreme → warning → advisory → watch
  alerts.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  return alerts;
}

function AlertItem({ alert, defaultOpen = false }: { alert: Alert; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const s = SEVERITY_STYLES[alert.severity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border overflow-hidden"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-xl leading-none">{alert.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: s.title }}>{alert.title}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.badge, color: s.badgeText }}>
              {SEVERITY_LABEL[alert.severity].toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ color: s.title }}>
          {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-white/60 text-sm leading-relaxed border-t border-white/8 pt-3">
              {alert.description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface Props {
  weather: WeatherData;
  condition: WeatherCondition;
  airQuality: AirQuality | null;
  forecast: ForecastDay[];
}

export default function WeatherAlerts({ weather, condition, airQuality, forecast }: Props) {
  const [expanded, setExpanded] = useState(true);
  const alerts = generateAlerts(weather, condition, airQuality, forecast);

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-5 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">No Active Alerts</p>
            <p className="text-white/40 text-xs">Conditions are looking safe right now</p>
          </div>
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400">All Clear</span>
        </div>
      </motion.div>
    );
  }

  const extremeCount = alerts.filter(a => a.severity === "extreme").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;
  const headerColor = extremeCount > 0 ? "#fca5a5" : warningCount > 0 ? "#fdba74" : "#fde047";
  const headerBg = extremeCount > 0 ? "rgba(239,68,68,0.2)" : warningCount > 0 ? "rgba(249,115,22,0.2)" : "rgba(234,179,8,0.15)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 overflow-hidden shadow-2xl"
      style={{ borderColor: extremeCount > 0 ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.15)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: headerBg }}>
          <AlertTriangle className="w-4 h-4" style={{ color: headerColor }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-sm">Weather Alerts</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: headerBg, color: headerColor }}>
              {alerts.length} Active
            </span>
          </div>
          <p className="text-white/40 text-xs mt-0.5">
            {extremeCount > 0 && `${extremeCount} extreme · `}
            {warningCount > 0 && `${warningCount} warning · `}
            Tap to {expanded ? "collapse" : "view"}
          </p>
        </div>
        <div className="text-white/40">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 flex flex-col gap-2.5 border-t border-white/8 pt-3">
              {alerts.map((alert, i) => (
                <AlertItem key={alert.id} alert={alert} defaultOpen={i === 0} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
