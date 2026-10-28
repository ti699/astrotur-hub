import { useState } from "react";
import { ArrowUpRight, Headset, LifeBuoy, Mail, Phone, ShieldCheck } from "lucide-react";
import { SYSTEMS, openSystem } from "@/config/systems";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const shortcuts = [
  {
    label: SYSTEMS.patrimonio.name,
    hint: "Gestão de Patrimônio",
    icon: ShieldCheck,
    system: SYSTEMS.patrimonio,
    tiContact: false,
  },
  {
    label: SYSTEMS.helpdesk.name,
    hint: "Chamados e Suporte de TI",
    icon: LifeBuoy,
    system: SYSTEMS.helpdesk,
    tiContact: false,
  },
  {
    label: "Contatos de TI",
    hint: "Ramais e suporte interno",
    icon: Headset,
    system: null,
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
            onClick={() => {
              if (s.tiContact || !s.system) {
                setTiOpen(true);
                return;
              }
              void openSystem(s.system).catch((error: unknown) => {
                toast.error(
                  error instanceof Error ? error.message : "Não foi possível acessar o sistema.",
                );
              });
            }}
            className={itemClass}
          >
            <s.icon className="h-4.5 w-4.5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {s.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{s.hint}</span>
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
          <div className="flex flex-col gap-3 pt-2">
            <a
              href="https://wa.me/5581973189640"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Phone className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">WhatsApp</span>
                <span className="block text-xs text-muted-foreground">81 973189640</span>
              </span>
              <span className="text-xs font-medium text-primary">Enviar mensagem</span>
            </a>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=ti@astroturviagens.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mail className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">E-mail</span>
                <span className="block truncate text-xs text-muted-foreground">
                  ti@astroturviagens.com
                </span>
              </span>
              <span className="text-xs font-medium text-primary">Enviar mensagem</span>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
