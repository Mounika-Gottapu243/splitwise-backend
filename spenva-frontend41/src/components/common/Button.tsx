interface ButtonProps {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary";
  className?: string;
}

function Button({
  label,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-full border px-4 py-2 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900/15 dark:focus:ring-white/20
        ${
          variant === "primary"
            ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800 dark:border-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        }
        ${className}
      `}
    >
      {label}
    </button>
  );
}

export default Button;


