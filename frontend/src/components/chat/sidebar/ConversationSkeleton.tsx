export function ConversationSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-slate-800/50">
      <div className="flex flex-col space-y-2 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          <div className="h-3 bg-slate-800 rounded w-12"></div>
        </div>
        <div className="h-3 bg-slate-800 rounded w-3/4"></div>
      </div>
    </div>
  );
}
