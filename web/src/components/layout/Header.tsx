import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex h-12 max-w-[1080px] items-center justify-between gap-4 px-4">
        <a href="#resumen" className="focus-ring flex items-center gap-2 rounded-ui">
          <Logo className="size-6 text-brand" />
          <span className="font-display text-xl font-bold tracking-wide uppercase">LoLStats</span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
