import React from "react";

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<string, string> = {
    primary: "bg-cyan-500 text-black hover:bg-cyan-400",
    secondary:
      "border border-zinc-800 bg-black/40 text-zinc-100 hover:bg-black/60",
    ghost: "text-zinc-200 hover:bg-white/10",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border border-zinc-800 bg-black/40 px-2.5 py-1 text-xs font-semibold text-zinc-200 shadow-sm " +
        className
      }
    >
      {children}
    </span>
  );
}
