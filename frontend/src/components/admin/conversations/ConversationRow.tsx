interface Props {
  customer: string;
  question: string;
  time: string;
  status: "Completed" | "Flagged";
}

function ConversationRow({
  customer,
  question,
  time,
  status,
}: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800 transition">

      <td className="py-4 px-4">{customer}</td>

      <td className="py-4 px-4">{question}</td>

      <td className="py-4 px-4">{time}</td>

      <td className="py-4 px-4">

        <span
          className={`px-3 py-1 rounded-full text-sm ${
            status === "Completed"
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {status}
        </span>

      </td>

      <td className="py-4 px-4">

        <button className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg transition">
          Open
        </button>

      </td>

    </tr>
  );
}

export default ConversationRow;