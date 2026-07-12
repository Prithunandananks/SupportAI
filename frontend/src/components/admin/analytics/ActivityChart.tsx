import type { ChartData } from "@/pages/admin/mockAnalyticsData";

interface Props {
  chartData: ChartData[];
}

function ActivityChart({ chartData }: Props) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 md:p-6">
      <h2 className="text-lg md:text-2xl font-semibold mb-4 md:mb-6">
        Chat Activity
      </h2>

      <div className="flex items-end justify-between h-36 sm:h-40 md:h-52 gap-2 md:gap-3">
        {chartData.map((data, index) => (
          <div
            key={index}
            className="
              relative
              group
              flex-1
              bg-gradient-to-t
              from-cyan-600
              to-cyan-400
              rounded-t-lg
              hover:opacity-90
              transition-all
              duration-300
              "
            style={{ height: `${data.height}%` }}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl hidden sm:block">
              <p className="font-bold border-b border-slate-700 pb-1 mb-2">{data.label}</p>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Chats:</span>
                <span className="font-medium">{data.chats}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-medium text-cyan-400">{data.avgConfidence}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Positive:</span>
                <span className="font-medium text-green-400">{data.positiveFeedback}</span>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-4 text-xs md:text-sm text-slate-400 gap-2 md:gap-3">
        {chartData.map((data, index) => (
          <span key={index} className="flex-1 text-center truncate">{data.label}</span>
        ))}
      </div>
    </div>
  );
}

export default ActivityChart;
