import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center px-6 py-3 rounded-full text-base font-medium transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed";
  const styles: Record<Variant, string> = {
    primary: "bg-stone-900 text-stone-50 hover:bg-stone-800",
    secondary: "bg-white text-stone-900 hover:bg-stone-100 shadow-sm border border-stone-200",
    ghost: "bg-transparent text-stone-700 hover:bg-stone-200",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest} />;
}
