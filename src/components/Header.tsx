import { Bell, Menu, Search } from "lucide-react";
import { currentUser } from "@/data/mockData";

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur md:px-8">
      <button
        onClick={onOpenMenu}
        aria-label="Abrir menu"
        className="rounded-md p-2 text-foreground transition-colors hover:bg-accent lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar no portal..."
          aria-label="Buscar no portal"
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-5">
        <button
          aria-label="Notificações"
          className="relative rounded-lg p-2 text-foreground transition-colors hover:bg-accent"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-foreground">
              {currentUser.name}
            </p>
            <p className="text-xs text-muted-foreground">{currentUser.role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {currentUser.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
