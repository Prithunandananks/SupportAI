import StatusBadge from "./StatusBadge";

interface Props {
  question: string;
  confidence: number;
  status: "Pending" | "Resolved";
}

function FlaggedRow({
  question,
  confidence,
  status,
}: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800 transition">

      <td className="py-4 px-4">
        {question}
      </td>

      <td className="py-4 px-4">

        <span
          className={`font-semibold ${
            confidence < 60
              ? "text-red-400"
              : "text-green-400"
          }`}
        >
          {confidence}%
        </span>

      </td>

      <td className="py-4 px-4">

        <StatusBadge status={status} />

      </td>

      <td className="py-4 px-4">

        <button className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg transition">

          Review

        </button>

      </td>

    </tr>
  );
}

export default FlaggedRow;