import type { Milestone } from "@/data/gettingStarted";
import { MilestoneCard } from "./MilestoneCard";

interface Props {
  title: string;
  milestones: Milestone[];
  columns?: 1 | 2;
}

export function MilestoneGrid({ title, milestones, columns = 2 }: Props) {
  return (
    <div>
      <h2 className="mb-4 text-[15px] font-semibold text-text-primary">{title}</h2>
      <div className={columns === 2 ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        {milestones.map((ms) => (
          <MilestoneCard key={ms.title} milestone={ms} />
        ))}
      </div>
    </div>
  );
}
