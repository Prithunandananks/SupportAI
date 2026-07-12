import type { TopicData } from "@/pages/admin/mockAnalyticsData";

interface Props {
  topics: TopicData[];
}

function TopTopics({ topics }: Props) {
  const topThreeTopics = topics.slice(0, 3);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 md:p-6 flex flex-col h-full">
      <h2 className="text-lg md:text-2xl font-semibold mb-4 md:mb-6">
        Top Topics
      </h2>

      <div className="space-y-4 md:space-y-6 flex-1">
        {topThreeTopics.map((topic, index) => (
          <div
            key={topic.name}
            className="border-b border-slate-800 pb-3 md:pb-4 last:border-0 last:pb-0"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">📄</span>
                <span className="text-sm md:text-base font-medium text-slate-200">{topic.name}</span>
              </div>
              <span className="text-cyan-400 font-semibold text-sm">
                #{index + 1}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
              <span>{topic.conversations} conversations</span>
              <span>{topic.popularity}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${topic.popularity}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopTopics;
