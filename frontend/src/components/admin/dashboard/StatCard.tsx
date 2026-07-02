import type { ReactNode } from "react";

interface Props {
  title: string;
  value: string;
  icon: ReactNode;
}

function StatCard({ title, value, icon }: Props) {
  return (
    <div
      className="
        group
        bg-slate-900
        rounded-2xl
        p-6
        border
        border-slate-800
        transition-all
        duration-300
        hover:border-cyan-500
        hover:-translate-y-1
        hover:shadow-xl
        hover:shadow-cyan-500/10
      "
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>
        </div>

        <div
          className="
            text-cyan-400
            transition-transform
            duration-300
            group-hover:scale-120
          "
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;