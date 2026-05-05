import { motion } from "framer-motion";

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{ borderTopColor: "rgba(255,255,255,0.8)" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-white/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          style={{ borderBottomColor: "rgba(255,255,255,0.5)" }}
        />
      </div>
      <motion.p
        className="text-white/50 text-sm"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Fetching weather...
      </motion.p>
    </div>
  );
}
