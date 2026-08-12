export default function InputField({
  label,
  error,
  icon,
  rightElement,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-sm font-medium text-[var(--text)] mb-1.5">{label}</span>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </span>
        )}
        <input
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-[15px] bg-[var(--surface)] text-[var(--text)] placeholder-[var(--text-secondary)] transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${
            error ? "border-[var(--error)]" : "border-[var(--border)]"
          } ${icon ? "pl-10" : ""} ${rightElement ? "pr-10" : ""} ${inputClassName}`}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>
        )}
      </div>
      {error && <span className="block text-xs text-[var(--error)] mt-1">{error}</span>}
    </label>
  );
}
