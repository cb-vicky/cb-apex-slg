import type { OperatorRailCard } from "@/data/gettingStarted";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface Props {
  cards: OperatorRailCard[];
}

export function OperatorRail({ cards }: Props) {
  return (
    <aside className="sticky top-0 flex flex-col gap-4">
      {cards.map((card) => (
        <div key={card.title} className="rounded-2xl border border-border-default bg-white p-5">
          <h4 className="text-[13px] font-semibold text-text-primary">{card.title}</h4>

          {card.body && (
            <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{card.body}</p>
          )}

          {card.items && (
            <ul className="mt-3 space-y-2">
              {card.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-text-secondary">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {card.links && (
            <div className="mt-3 space-y-3">
              {card.links.map((link) => (
                <button key={link.title} className="flex w-full items-start gap-2 text-left">
                  <ArrowRight size={14} className="mt-0.5 shrink-0 text-cb-orange" />
                  <div>
                    <p className="text-[13px] font-medium text-text-primary hover:text-cb-orange">
                      {link.title}
                    </p>
                    <p className="text-[12px] leading-relaxed text-text-muted">{link.subtext}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
