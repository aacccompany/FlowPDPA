import { Moon, Sun } from "lucide-react";
import type { Theme } from "@/hooks/useTheme";

/** Icon button that switches between the light and dark theme. */
export function ThemeToggle({
  theme,
  onToggle,
  className = "",
}: {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={dark}
      aria-label={dark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
      title={dark ? "โหมดสว่าง" : "โหมดมืด"}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-gray-500 hover:bg-gray-100 ${className}`}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
