import { motion } from "framer-motion";
import { Cloud, MapPin } from "lucide-react";

interface Props {
  onLocate: () => void;
}

export default function EmptyState({ onLocate }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-5 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center"
      >
        <Cloud className="w-10 h-10 text-white/50" />
      </motion.div>
      <div>
        <h2 className="text-white text-xl font-semibold mb-1" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}>Check the weather</h2>
        <p className="text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.82)", textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>
          Search for any city above or use your current location to get started.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onLocate}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all"
      >
        <MapPin className="w-4 h-4" />
        Use my location
      </motion.button>
    </motion.div>
  );
}
