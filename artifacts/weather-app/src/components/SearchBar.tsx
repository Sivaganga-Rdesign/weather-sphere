import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, X } from "lucide-react";
import { useRecentSearches } from "../hooks/useWeather";

interface Props {
  onSearch: (city: string) => void;
  onLocate: () => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, onLocate, loading }: Props) {
  const [query, setQuery] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { get: getRecent } = useRecentSearches();
  const recent = getRecent();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed);
      setShowRecent(false);
      inputRef.current?.blur();
    }
  };

  const handleRecentClick = (city: string) => {
    setQuery(city);
    onSearch(city);
    setShowRecent(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowRecent(true)}
              placeholder="Search city..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-3.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 text-white font-medium text-sm hover:bg-white/30 transition-all disabled:opacity-50"
          >
            Search
          </motion.button>
          <motion.button
            type="button"
            onClick={onLocate}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Use my location"
            className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all disabled:opacity-50"
          >
            <MapPin className="w-4 h-4" />
          </motion.button>
        </div>
      </form>

      <AnimatePresence>
        {showRecent && recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden z-50"
          >
            <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Recent</span>
            </div>
            {recent.map((city, i) => (
              <button
                key={i}
                onClick={() => handleRecentClick(city)}
                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
              >
                <Search className="w-3.5 h-3.5 text-white/30" />
                {city}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
