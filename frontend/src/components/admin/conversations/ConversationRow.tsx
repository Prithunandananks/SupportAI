import { Search, Trash2, Download } from "lucide-react";

interface Props {
  id: string;
  customer: string;
  question: string;
  messageCount: number;
  time: string;
  onInspect: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

function ConversationRow({
  id,
  customer,
  question,
  messageCount,
  time,
  onInspect,
  onDelete,
  onExport,
}: Props) {
  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
      <td className="py-4 px-4 font-medium">{customer}</td>
      <td className="py-4 px-4 max-w-[200px] truncate" title={question}>{question}</td>
      <td className="py-4 px-4 text-slate-400">
        <span className="bg-slate-800 px-2 py-1 rounded text-xs font-semibold">{messageCount}</span>
      </td>
      <td className="py-4 px-4 text-slate-400 text-sm">{time}</td>
      <td className="py-4 px-4">
        <div className="flex gap-2">
          <button 
            onClick={() => onInspect(id)}
            className="flex items-center gap-1 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white px-3 py-1.5 rounded transition text-sm"
            title="Inspect Chat"
          >
            <Search size={16} />
            Inspect
          </button>
          
          <button 
            onClick={() => onExport(id)}
            className="flex items-center gap-1 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-1.5 rounded transition text-sm"
            title="Export JSON"
          >
            <Download size={16} />
            Export
          </button>

          <button 
            onClick={() => onDelete(id)}
            className="flex items-center gap-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white p-1.5 rounded transition text-sm"
            title="Delete Conversation"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default ConversationRow;