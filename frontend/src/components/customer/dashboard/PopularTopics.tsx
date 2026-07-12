export interface TopicData {
  name: string;
  conversations: number;
  popularity: number;
}import { Hash, TrendingUp } from "lucide-react";
import DashboardCard from "./DashboardCard";

interface Props {
  topics: TopicData[];
}

function PopularTopics({ topics }: Props) {
  const topThreeTopics = topics.slice(0, 3);

  return (
    <DashboardCard title="Popular Topics">
      {topThreeTopics.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="mx-auto h-12 w-12 text-slate-700 mb-3" />
          <p className="text-slate-400 text-sm">No trending topics right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topThreeTopics.map(topic => (
            <div key={topic.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:bg-slate-800/50 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  <Hash size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{topic.name}</p>
                  <p className="text-xs text-slate-500">{topic.conversations} conversations</p>
                </div>
              </div>
              
              {topic.popularity >= 25 && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md">Hot</span>
              )}
              {topic.popularity >= 15 && topic.popularity < 25 && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">Trending</span>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

export default PopularTopics;

