import type { ReactNode } from "react";

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

function DashboardCard({ title, children, className = "", action }: Props) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700/50 hover:shadow-2xl hover:shadow-cyan-900/5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export default DashboardCard;
