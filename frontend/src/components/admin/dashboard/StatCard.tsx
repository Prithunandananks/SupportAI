import type { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
}

function StatCard({ title, value, icon, trend, trendLabel }: Props) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div
      className="
      group
      bg-slate-900
      rounded-xl
      md:rounded-2xl
      p-4
      md:p-6
      border
      border-slate-800
      transition-all
      duration-300
      hover:border-cyan-500
      hover:-translate-y-1
      hover:shadow-xl
      hover:shadow-cyan-500/10
      flex flex-col
      justify-between
      "
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-xs md:text-sm ">
            {title}
          </p>

          <h2 className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
            {value}
          </h2>
        </div>

        <div
          className="
            text-cyan-400
            transition-transform
            duration-300
            group-hover:scale-110
          "
        >
          {icon}
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-3 flex items-center text-xs md:text-sm">
          <div className={`flex items-center font-medium ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400'}`}>
            {isPositive && <ArrowUp size={14} className="mr-1" />}
            {isNegative && <ArrowDown size={14} className="mr-1" />}
            {Math.abs(trend)}%
          </div>
          {trendLabel && <span className="ml-2 text-slate-500">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;