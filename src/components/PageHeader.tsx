import { ReactNode } from "react";

export const PageHeader = ({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) => (
  <div className="flex items-end justify-between mb-8 animate-fade-up">
    <div>
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h1 className="h1">{title}</h1>
    </div>
    {action}
  </div>
);
