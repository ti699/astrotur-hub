import { useState } from "react";
import { ArrowUpRight, Headset, LifeBuoy, Mail, Phone, ShieldCheck } from "lucide-react";
import { SYSTEMS, openSystem } from "@/config/systems";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const shortcuts = [
  {
    label: SYSTEMS.patriguard.name,
    hint: "Gestão de Patrimônio",
    icon: ShieldCheck,
    url: SYSTEMS.patriguard.url,
    tiContact: false,
  },
  {
    label: SYSTEMS.helpdesk.name,
    hint: "Chamados e Suporte de TI",
    icon: LifeBuoy,
    url: SYSTEMS.helpdesk.url,
    tiContact: false,
  },
  {
    label: "Contatos de TI",
    hint: "Ramais e suporte interno",
    icon: Headset,
    url: "",
    tiContact: true,
  },
] as const;

const itemClass =
  "group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-all duration-200 hover:border-neutral-mid hover:shadow-soft";

export function QuickAccess() {
  const [tiOpen, setTiOpen] = useState(false);

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Acesso rápido
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            onClick={() => s.tiContact ? setTiOpen(true) : openSystem(s.url)}
            className={itemClass}
          >
            <s.icon className="h-4.5 w-4.5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {s.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {s.hint}
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <Dialog open={tiOpen} onOpenChange={setTiOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Contatos de TI</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm font-medium">81 973189640</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm font-medium">ti@astroturviagens.com</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
