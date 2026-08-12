import { forwardRef } from "react";
import { motion } from "framer-motion";

const Card = forwardRef(function Card({ className = "", animate = true, ...props }, ref) {
  const Comp = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 300, damping: 28 },
      }
    : {};
  return (
    <Comp
      ref={ref}
      className={`bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm shadow-slate-900/[0.03] p-4 ${className}`}
      {...motionProps}
      {...props}
    />
  );
});

export default Card;
