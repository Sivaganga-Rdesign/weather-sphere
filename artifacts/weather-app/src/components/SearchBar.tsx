import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, X, Loader2 } from "lucide-react";
import { useRecentSearches } from "../hooks/useWeather";
import { GeoResult } from "../services/weatherService";

interface Props {
  onSearch: (city: string) => void;
  onLocate: () => void;
  loading: boolean;
  getSuggestions: (query: string) => Promise<GeoResult[]>;
}

function flag(countryCode: string) {
  return countryCode
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

function locationLabel(geo: GeoResult) {
  const parts = [geo.name];
  if (geo.state) parts.push(geo.state);
  parts.push(geo.country);
  return parts.join(", ");
}

export default function SearchBar({ onSearch, onLocate, loading, getSuggestions }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { get: getRecent } = useRecentSearches();
  const recent = getRecent();

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setSugLoading(false);
      return;
    }
    setSugLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await getSuggestions(val);
      setSuggestions(results);
      setSugLoading(false);
    }, 320);
  };

  const handleSelect = useCallback((label: string) => {
    setQuery(label);
    setSuggestions([]);
    setShowDropdown(false);
    onSearch(label);
    inputRef.current?.blur();
  }, [onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    // If there's an exact suggestion match, use that full label for more accurate lookup
    if (suggestions.length > 0) {
      handleSelect(locationLabel(suggestions[0]));
    } else {
      onSearch(trimmed);
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleRecentClick = (city: string) => {
    setQuery(city);
    setSuggestions([]);
    setShowDropdown(false);
    onSearch(city);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showSuggestions = showDropdown && query.trim().length >= 2 && (sugLoading || suggestions.length > 0);
  const showRecent = showDropdown && query.trim().length < 2 && recent.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search city, town or village..."
              autoComplete="off"
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/35 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all text-sm"
            />
            {query ? (
              <button
                type="button"
                onClick={() => { setQuery(""); setSuggestions([]); setSugLoading(false); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          <motion.button
            type="submit"
            disabled={loading || !query.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-3.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 text-white font-medium text-sm hover:bg-white/30 transition-all disabled:opacity-40"
          >
            Search
          </motion.button>

          <motion.button
            type="button"
            onClick={onLocate}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Detect my location"
            className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all disabled:opacity-40 relative"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          </motion.button>
        </div>
      </form>

      {/* Dropdown */}
      <AnimatePresence>
        {(showSuggestions || showRecent) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/12 overflow-hidden z-50 shadow-2xl"
          >
            {/* Suggestions */}
            {showSuggestions && (
              <>
                <div className="px-4 py-2 border-b border-white/8 flex items-center gap-2">
                  {sugLoading
                    ? <Loader2 className="w-3.5 h-3.5 text-white/40 animate-spin" />
                    : <Search className="w-3.5 h-3.5 text-white/40" />}
                  <span className="text-xs text-white/40 font-medium uppercase tracking-wider">
                    {sugLoading ? "Searching..." : `${suggestions.length} result${suggestions.length !== 1 ? "s" : ""}`}
                  </span>
                </div>
                {suggestions.map((geo, i) => (
                  <button
                    key={`${geo.lat}-${geo.lon}-${i}`}
                    type="button"
                    onClick={() => handleSelect(locationLabel(geo))}
                    className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg leading-none">{flag(geo.country)}</span>
                    <div className="min-w-0">
                      <span className="font-medium text-white">{geo.name}</span>
                      {(geo.state || geo.country) && (
                        <span className="text-white/45 text-xs ml-1.5">
                          {[geo.state, geo.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                    <span className="ml-auto text-white/25 text-xs font-mono shrink-0">
                      {geo.lat.toFixed(2)}, {geo.lon.toFixed(2)}
                    </span>
                  </button>
                ))}
                {!sugLoading && suggestions.length === 0 && (
                  <div className="px-4 py-4 text-white/40 text-sm text-center">
                    No results. Try adding state or country — e.g. "Koproli, Maharashtra"
                  </div>
                )}
              </>
            )}

            {/* Recent searches */}
            {showRecent && (
              <>
                <div className="px-4 py-2 border-b border-white/8 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Recent</span>
                </div>
                {recent.map((city, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleRecentClick(city)}
                    className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <Clock className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    {city}
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
