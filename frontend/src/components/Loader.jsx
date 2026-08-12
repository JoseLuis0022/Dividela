import { motion } from "framer-motion";

export default function Loader({ size = 28, className = "" }) {
  const circumference = 2 * Math.PI * 10;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      className={`text-[var(--primary)] ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.25}
        opacity={0.9}
      />
    </motion.svg>
  );
}
