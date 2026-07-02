import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline";
  children: ReactNode;
}

/**
 * Bouton de référence du design system.
 * - primary  : action principale de l'écran (1 seul par écran/section)
 * - secondary: action alternative, neutre
 * - destructive: suppression, refus, annulation
 */
export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary:
      "bg-coral-400 text-white shadow-lg shadow-coral-400/20 hover:bg-coral-500 hover:shadow-xl hover:shadow-coral-400/30 active:scale-[0.97]",
    secondary:
      "bg-white text-gray-900 border border-gray-100 hover:bg-gray-50 shadow-sm active:scale-[0.97]",
    destructive:
      "bg-red-50 text-red-800 border border-red-100 hover:bg-red-100 active:scale-[0.97]",
    outline:
      "bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-50 active:scale-[0.97]",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}