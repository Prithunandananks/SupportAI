interface Props {
  customer: string;
  question: string;
  time: string;
  status: "Completed" | "Flagged";
  onOpen: () => void;
}

function ConversationRow({
  customer,
  question,
  time,
  status,
  onOpen,
}: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800 transition">

      <td className="py-3 md:py-4 px-2 md:px-4">
        {customer}
      </td>

      <td className="py-3 md:py-4 px-2 md:px-4">
        {question}
      </td>

      <td className="py-3 md:py-4 px-2 md:px-4 text-slate-400">
        {time}
      </td>

      <td className="py-3 md:py-4 px-2 md:px-4">

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

      <td className="py-3 md:py-4 px-2 md:px-4">

        <button
          onClick={onOpen}
          className="
            bg-cyan-500
            hover:bg-cyan-600
            px-4
            py-2
            rounded-lg
            text-sm
            transition
          "
        >
          Open
        </button>

      </td>

    </tr>
  );
}

export default ConversationRow;