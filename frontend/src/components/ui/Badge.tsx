import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "neutral" | "warning" | "danger";
}

const styles = {
  success: "bg-green-100 text-green-700",
  neutral: "bg-slate-200 text-slate-600",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

export default function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}