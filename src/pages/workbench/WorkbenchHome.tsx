import { useState } from "react";
import { WorkbenchTaskList } from "./WorkbenchTaskList";

/** Picked once per mount / full page refresh — demo user name matches shell prototype. */
const WORKBENCH_GREETINGS = [
  "Hi, Alex. Finance calls.",
  "Morning, Alex. Chase cash.",
] as const;

export function WorkbenchHome() {
  const [greeting] = useState(
    () => WORKBENCH_GREETINGS[Math.floor(Math.random() * WORKBENCH_GREETINGS.length)],
  );

  return (
    <div className="flex-1 w-full overflow-auto">
      <div className="px-6 pt-5 pb-7">
        <header className="mb-6">
          <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-text-muted">
            My tasks
          </p>
          <h1 className="max-w-3xl text-[30px] font-semibold leading-tight tracking-tight text-text-primary">
            {greeting}
          </h1>
        </header>

        <WorkbenchTaskList />
      </div>
    </div>
  );
}
