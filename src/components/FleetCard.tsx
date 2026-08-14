import { ArrowRight, Bus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import busAsset from "@/assets/astrotur-bus.jpg.asset.json";
import type { FeaturedVehicle } from "@/data/mockData";

interface FleetCardProps {
  vehicle: FeaturedVehicle;
  /** URL da imagem real do veículo; se ausente, exibe placeholder elegante. */
  imageUrl?: string;
}

export function FleetCard({ vehicle, imageUrl = busAsset.url }: FleetCardProps) {
  return (
    <article className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow duration-300 hover:shadow-lift md:grid-cols-[45%_55%]">
      <div className="relative min-h-56 bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Ônibus ${vehicle.code} da frota Astrotur`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Bus className="h-10 w-10" />
            <span className="text-xs">Imagem do veículo indisponível</span>
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-foreground/85 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-background">
          Ônibus em destaque
        </span>
      </div>

      <div className="flex flex-col justify-center gap-5 p-6 md:p-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {vehicle.code}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{vehicle.line}</p>
        </div>

        <div className="h-px bg-border" />

        <dl className="grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Status
            </dt>
            <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="h-2 w-2 rounded-full bg-success" />
              {vehicle.status}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Modelo
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {vehicle.model}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Capacidade
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {vehicle.capacity}
            </dd>
          </div>
        </dl>

        <Link
          to="/frota"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary hover:text-primary active:scale-[0.98]"
        >
          Ver detalhes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
